import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Brew } from './Brew'

afterEach(() => cleanup())

describe('brew controls', () => {
  it('loads the ristretto preset into the sliders', () => {
    render(<Brew say={() => {}} active />)
    fireEvent.click(screen.getByRole('button', { name: /Ristretto/ }))
    expect(screen.getByLabelText('Yield in grams')).toHaveValue(24)
    expect(screen.getByLabelText('Shot time in seconds')).toHaveValue(24)
    expect(screen.getByRole('slider', { name: 'Yield' })).toHaveValue('24')
  })

  it('updates yield from the slider', () => {
    render(<Brew say={() => {}} active />)
    fireEvent.change(screen.getByRole('slider', { name: 'Yield' }), { target: { value: '40' } })
    expect(screen.getByLabelText('Yield in grams')).toHaveValue(40)
    expect(screen.getByText(/40\.0/)).toBeInTheDocument()
  })

  it('opens the checklist and the session log', () => {
    render(<Brew say={() => {}} active />)
    fireEvent.click(screen.getByRole('button', { name: /Curve, checklist and log/ }))
    expect(screen.getByText('Purge group & dry basket')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log this shot' })).toBeInTheDocument()
    expect(screen.getByText(/Illustration only/)).toBeInTheDocument()
  })

  it('names time and yield on the ring', () => {
    render(<Brew say={() => {}} active />)
    expect(screen.getByRole('img', { name: /Time 28 seconds/ })).toHaveAccessibleName(/Yield 36 grams/)
  })
})
