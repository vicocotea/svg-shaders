import { useEffect, useState, useRef, useCallback } from 'react'

function useAnimatedNumber(target, duration = 300) {
  const [value, setValue] = useState(target)
  const animationRef = useRef(null)

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    let start = null
    const initial = value
    const delta = target - initial

    const step = timestamp => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setValue(initial + delta * progress)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step)
      }
    }

    animationRef.current = requestAnimationFrame(step)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [target, duration])

  return value
}

// Hook pour animer plusieurs valeurs simultanément
function useAnimatedValues(initialValues, duration = 300) {
  const [values, setValues] = useState(initialValues)
  const animationRef = useRef(null)

  const animateTo = useCallback((targetValues) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    let start = null
    const initial = { ...values }
    const deltas = {}
    
    Object.keys(targetValues).forEach(key => {
      deltas[key] = targetValues[key] - initial[key]
    })

    const step = timestamp => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      
      const newValues = {}
      Object.keys(targetValues).forEach(key => {
        newValues[key] = initial[key] + deltas[key] * progress
      })
      
      setValues(newValues)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step)
      }
    }

    animationRef.current = requestAnimationFrame(step)
  }, [values, duration])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return [values, animateTo]
}

// Hook spécialisé pour animer les points avec leur propriété life
function useAnimatedPoints(initialPoints = [], duration = 1000) {
  const [points, setPoints] = useState(initialPoints)
  const animationRef = useRef(null)

  const addPoint = useCallback((newPoint) => {
    setPoints(prev => [...prev, { ...newPoint, life: 0 }])
  }, [])

  const animatePoints = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    let start = null
    const initialPointsState = [...points]

    const step = timestamp => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      
      setPoints(prev => 
        prev.map(point => ({
          ...point,
          life: Math.min(100, point.life + (100 / (duration / 16))) // 60fps approximation
        })).filter(point => point.life < 100)
      )

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step)
      }
    }

    if (points.length > 0) {
      animationRef.current = requestAnimationFrame(step)
    }
  }, [points.length, duration])

  useEffect(() => {
    if (points.length > 0) {
      animatePoints()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [points.length, animatePoints])

  return [points, addPoint]
}

export { useAnimatedNumber, useAnimatedValues, useAnimatedPoints }
