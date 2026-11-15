import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));

async function submitTextWithApiError(status, retryAfter) {
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    headers: {
      get: (name) => (name === 'Retry-After' ? retryAfter : null),
    },
    json: jest.fn().mockResolvedValue({ detail: 'Server detail' }),
  });

  try {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /paste text/i }));
    fireEvent.change(
      screen.getByRole('textbox', { name: /paste your resume text/i }),
      { target: { value: 'Resume content' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));
    return await screen.findByRole('alert');
  } finally {
    global.fetch = originalFetch;
  }
}

test('switches between PDF upload and pasted resume text', () => {
  render(<App />);

  expect(
    screen.getByRole('button', { name: /upload pdf/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/PDF limit: 4 MB maximum and up to 50 pages/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/choose one input method at a time/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: /paste your resume text/i }),
  ).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /paste text/i }));
  const resumeTextInput = screen.getByRole('textbox', {
    name: /paste your resume text/i,
  });
  expect(resumeTextInput).toBeInTheDocument();
  expect(resumeTextInput).toHaveAttribute('maxLength', '100000');
  expect(
    screen.getByText(/0 \/ 100,000 characters/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /upload pdf/i }),
  ).not.toBeInTheDocument();

  fireEvent.change(resumeTextInput, { target: { value: 'Resume content' } });
  fireEvent.click(screen.getByRole('button', { name: /^pdf$/i }));
  expect(
    screen.getByRole('button', { name: /upload pdf/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /paste text/i }));
  expect(
    screen.getByRole('textbox', { name: /paste your resume text/i }),
  ).toHaveValue('Resume content');
});

test('rejects PDFs larger than 4 MB before submission', () => {
  render(<App />);
  const pdfInput = screen.getByLabelText('Upload resume PDF');
  const oversizedPdf = new File(
    [new Uint8Array(4 * 1024 * 1024 + 1)],
    'large.pdf',
    { type: 'application/pdf' },
  );

  fireEvent.change(pdfInput, { target: { files: [oversizedPdf] } });

  expect(screen.getByRole('alert')).toHaveTextContent(
    /PDFs must be no larger than 4 MB/i,
  );
  expect(screen.queryByText('large.pdf')).not.toBeInTheDocument();
});

test.each([
  [400, null, /invalid resume input or pdf/i, 'Submit', false],
  [413, null, /pasted text must be 100,000 characters or fewer/i, 'Submit', false],
  [422, null, /resume is empty or could not be recognized/i, 'Submit', false],
  [429, '5', /too many requests/i, /try again in 5s/i, true],
])(
  'shows a useful message for backend status %i',
  async (status, retryAfter, message, buttonName, isDisabled) => {
    const alert = await submitTextWithApiError(status, retryAfter);

    expect(alert).toHaveTextContent(message);
    expect(alert).toHaveTextContent(/server detail/i);
    expect(screen.getByRole('button', { name: buttonName }).disabled).toBe(
      isDisabled,
    );
  },
);
