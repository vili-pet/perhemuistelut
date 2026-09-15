interface ExportPanelProps {
  interviewId: string
  updatedAt: string
  respondentNames: string
  factCount: number
  onExportText: () => void
  onExportJson: () => void
}

export function ExportPanel({
  interviewId,
  updatedAt,
  respondentNames,
  factCount,
  onExportText,
  onExportJson,
}: ExportPanelProps) {
  return (
    <section className="export" aria-labelledby="vienti-otsikko">
      <h2 id="vienti-otsikko">Tallennus ja kopio</h2>
      <p className="status-line" role="status">
        {respondentNames} tarinat ovat tallessa tällä laitteella. Selaimen sulkeminen ei pyyhi
        niitä. Viimeksi {updatedAt}.
      </p>
      <p>
        Ottakaa kopio tiedostona, jos haluatte varmuuskopion pois selaimesta. JSON sisältää
        aihemerkit, faktapankin ({factCount} faktaa), henkilökohtaiset tukikysymykset ja
        äänimetatiedot, mutta ei äänibittiä.
      </p>
      <p className="export__meta">
        Istunto <code>{interviewId}</code>
      </p>
      <div className="button-row">
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
