import { useEffect, useRef } from "react";

export default function useBackgroundEffects(wavyEffect, particleEffect) {
  const canvasRef = useRef(null);
  const waveRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    if (!wavyEffect && !particleEffect) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.style.display = "none";
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";

    const ctx = canvas.getContext("2d");
    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2 + 1,
      });
    }

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (wavyEffect) {
        ctx.strokeStyle = "rgba(102, 126, 234, 0.3)";
        ctx.lineWidth = 2;

        for (let wave = 0; wave < 3; wave++) {
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 5) {
            const y =
              canvas.height -
              100 +
              wave * 40 +
              Math.sin((x + time + waveRef.current.x) * 0.01) * 30 +
              Math.cos((time + waveRef.current.y) * 0.005) * 20;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      if (particleEffect) {
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          ctx.fillStyle = `rgba(102, 126, 234, ${0.5 + Math.sin(time * 0.02) * 0.3})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (wavyEffect) {
        particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          if (particle.y > canvas.height - 200) {
            ctx.fillStyle = `rgba(102, 126, 234, ${0.5 + Math.sin(time * 0.02) * 0.3})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      time += 2;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (event) => {
      waveRef.current.x = event.clientX;
      waveRef.current.y = event.clientY;
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [wavyEffect, particleEffect]);

  return canvasRef;
}
