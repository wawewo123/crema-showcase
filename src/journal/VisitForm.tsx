import type { FormEvent, RefObject } from 'react'

export type Draft = {
  name: string
  area: string
  notes: string
  date: string
  photo?: string
  thumb?: string
}

type Props = {
  title: string
  draft: Draft
  setDraft: (d: Draft) => void
  pin: { lat: number; lng: number } | null
  photoBusy: boolean
  error: string | null
  onDropCentre: () => void
  onMove: () => void
  onPhoto: (file: File | undefined) => void
  onRemovePhoto: () => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  nameRef: RefObject<HTMLInputElement | null>
}

export function VisitForm({
  title,
  draft,
  setDraft,
  pin,
  photoBusy,
  error,
  onDropCentre,
  onMove,
  onPhoto,
  onRemovePhoto,
  onSubmit,
  onCancel,
  nameRef,
}: Props) {
  return (
    <form className="visit-form" onSubmit={onSubmit} noValidate>
      <h2>{title}</h2>
      <p className={pin ? 'pin-status ok' : 'pin-status'}>
        {pin ? (
          <>
            Pin at {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}{' '}
            <button type="button" className="text-btn" onClick={onMove}>
              Move pin
            </button>
          </>
        ) : (
          <>Tap the map, or drop a pin in the middle of what you see.</>
        )}
      </p>
      <button type="button" className="btn ghost" data-testid="drop-centre" onClick={onDropCentre}>
        Drop pin at centre
      </button>
      <label>
        Café name
        <input
          ref={nameRef}
          data-testid="visit-name"
          required
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          autoComplete="off"
          placeholder="The place by the station"
        />
      </label>
      <label>
        Address or area <span className="opt">optional · used for the Maps link</span>
        <input
          value={draft.area}
          onChange={(e) => setDraft({ ...draft, area: e.target.value })}
          autoComplete="off"
          placeholder="Street, neighbourhood, city"
        />
      </label>
      <label>
        Date
        <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
      </label>
      <label>
        Photo <span className="opt">optional · resized on this device</span>
        <span className="photo-row">
          {draft.photo && <img src={draft.photo} alt="" />}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onPhoto(e.target.files?.[0])}
          />
        </span>
        {draft.photo && (
          <button type="button" className="text-btn" onClick={onRemovePhoto}>
            Remove photo
          </button>
        )}
        {photoBusy && <span className="opt">Resizing…</span>}
      </label>
      <label>
        What did you drink?
        <textarea
          rows={3}
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Flat white, chocolatey, a bit hot…"
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="row-btns">
        <button className="btn" type="submit" data-testid="save-visit" disabled={photoBusy}>
          Save visit
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
