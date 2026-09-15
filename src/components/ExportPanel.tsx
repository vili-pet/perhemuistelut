interface ExportPanelProps {
  interviewId: string
  updatedAt: string
  respondentNames: string
  factCount: number
  recordingCount: number
  onExportText: () => void
  onExportJson: () => void
  onDownloadAudio: () => void
}

export function ExportPanel({
  interviewId,
  updatedAt,
  respondentNames,
  factCount,
  recordingCount,
  onExportText,
  onExportJson,
  onDownloadAudio,
}: ExportPanelProps) {
  return (
    <section className="export" aria-labelledby="vienti-otsikko">
      <h2 id="vienti-otsikko">Tallennus ja kopio</h2>
      <p className="status-line" role="status">
        {respondentNames} tarinat ovat tällä laitteella. Selainkopio (localStorage / IndexedDB) ei
        yksin riitä. Viimeksi {updatedAt}.
      </p>
      <p>
        Jokaisen keskustelun päätteeksi tallenna äänitiedosto koneelle tai puhelimeen. Vie se
        myöhemmin Hedyyn. JSON sisältää aihemerkit, faktapankin ({factCount} faktaa),
        henkilökohtaiset tukikysymykset ja äänimetatiedot, mutta ei äänibittiä.
      </p>
      <p className="export__meta">
        Istunto <code>{interviewId}</code>
      </p>
      <div className="button-row">
        <button
          type="button"
          className="btn btn--save"
          onClick={onDownloadAudio}
          disabled={recordingCount === 0}
        >
          Tallenna äänitiedosto koneelle/puhelimeen
        </button>
        <button type="button" className="btn btn--save" onClick={onExportText}>
          Lataa tarinat tekstinä
        </button>
        <button type="button" className="btn" onClick={onExportJson}>
          Lataa JSON
        </button>
      </div>
    </section>
  )
}
