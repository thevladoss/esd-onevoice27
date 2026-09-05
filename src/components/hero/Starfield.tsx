export function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfield__layer starfield__layer--a" />
      <div className="starfield__layer starfield__layer--b" />
      <div className="starfield__glow starfield__glow--signal" />
      <div className="starfield__glow starfield__glow--unity-a" />
      <div className="starfield__glow starfield__glow--unity-b" />
    </div>
  );
}
