import { useEffect, useRef } from 'react';

import { cn } from '@/utils/utils';

export interface ParticlesProps {
  className?: string
  children?: React.ReactNode
  quantity?: number
  size?: number
  refresh?: boolean
  color?: string
  vx?: number
  vy?: number
}

function hexToRgb(hex: string): number[] {
  let normalized = hex.replace("#", "")
  if (normalized.length === 3) {
    normalized = normalized.split("").map(char => char + char).join("")
  }
  const hexInt = Number.parseInt(normalized, 16)
  const red = (hexInt >> 16) & 255
  const green = (hexInt >> 8) & 255
  const blue = hexInt & 255
  return [red, green, blue]
}

interface Circle {
  x: number
  y: number
  size: number
  alpha: number
  targetAlpha: number
  dx: number
  dy: number
}

export const Particles: React.FC<ParticlesProps> = ({
  className,
  children,
  quantity = 200,
  size = 0.4,
  refresh = true,
  color = "#ffffff",
  vx = 0.05,
  vy = 0.05,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const context = useRef<CanvasRenderingContext2D | null>(null)
  const circles = useRef<Circle[]>([])
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const animationRef = useRef<number>(undefined)
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d")
    }
    initCanvas()
    animate()
    window.addEventListener("resize", initCanvas)

    return () => {
      window.removeEventListener("resize", initCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [color])

  useEffect(() => {
    initCanvas()
  }, [refresh])

  const initCanvas = () => {
    resizeCanvas()
    drawParticles()
  }

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0
      canvasSize.current.w = canvasContainerRef.current.offsetWidth
      canvasSize.current.h = canvasContainerRef.current.offsetHeight
      canvasRef.current.width = canvasSize.current.w * dpr
      canvasRef.current.height = canvasSize.current.h * dpr
      canvasRef.current.style.width = `${canvasSize.current.w}px`
      canvasRef.current.style.height = `${canvasSize.current.h}px`
      context.current.scale(dpr, dpr)
    }
  }

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w)
    const y = Math.floor(Math.random() * canvasSize.current.h)
    const pSize = Math.floor(Math.random() * 2) + size
    const alpha = 0
    const targetAlpha = Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1))
    const dx = (Math.random() - 0.5) * 0.1
    const dy = (Math.random() - 0.5) * 0.1
    return { x, y, size: pSize, alpha, targetAlpha, dx, dy }
  }

  const rgb = hexToRgb(color)

  const drawCircle = (circle: Circle, update = false) => {
    if (context.current) {
      const { x, y, size, alpha } = circle
      context.current.beginPath()
      context.current.arc(x, y, size, 0, 2 * Math.PI)
      context.current.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`
      context.current.fill()

      if (!update) {
        circles.current.push(circle)
      }
    }
  }

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h)
    }
  }

  const drawParticles = () => {
    clearContext()
    for (let i = 0; i < quantity; i++) {
      const circle = circleParams()
      drawCircle(circle)
    }
  }

  const remapValue = (v: number, s1: number, e1: number, s2: number, e2: number): number => {
    const remapped = ((v - s1) * (e2 - s2)) / (e1 - s1) + s2
    return remapped > 0 ? remapped : 0
  }

  const animate = () => {
    clearContext()
    circles.current.forEach((circle, i) => {
      // Плавное появление/исчезновение у краев
      const edge = [
        circle.x - circle.size,
        canvasSize.current.w - circle.x - circle.size,
        circle.y - circle.size,
        canvasSize.current.h - circle.y - circle.size,
      ]
      const closestEdge = Math.min(...edge)
      const remapClosestEdge = Number.parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2))

      if (remapClosestEdge > 1) {
        circle.alpha += 0.02
        if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge
      }

      // Движение
      circle.x += circle.dx + vx
      circle.y += circle.dy + vy

      drawCircle(circle, true)

      // Возврат частиц, вышедших за границы
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        circles.current.splice(i, 1)
        const newCircle = circleParams()
        drawCircle(newCircle)
      }
    })
    animationRef.current = window.requestAnimationFrame(animate)
  }

  return (
    <div ref={canvasContainerRef} className={cn("fixed inset-0 overflow-hidden bg-zinc-950", className)}>
      <canvas className="absolute inset-0 size-full" ref={canvasRef} />
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  )
}

Particles.displayName = "Particles"

export default function ParticlesBackground() {
  return <Particles />
}