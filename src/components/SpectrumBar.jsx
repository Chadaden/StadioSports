export default function SpectrumBar() {
  const colors = [
    '#F59120', '#FFCE00', '#96C93E', '#4EBEA3',
    '#3BB1E5', '#227D9F', '#8A63A9', '#E77BB0', '#ED1C24',
  ];
  return (
    <div className="spectrum-bar">
      {colors.map((c) => (
        <div key={c} className="seg" style={{ background: c }} />
      ))}
    </div>
  );
}
