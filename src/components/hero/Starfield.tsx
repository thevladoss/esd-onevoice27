export function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      {/* Дрейф живёт на слоях точек, поэтому data-anim стоит на них, а не на
          корне: блок reduced motion гасит ровно носителя анимации. Пятна
          свечения ниже статичны и атрибут не несут. */}
      <div className="starfield__layer starfield__layer--a" data-anim="stars" />
      <div className="starfield__layer starfield__layer--b" data-anim="stars" />
      <div className="starfield__glow starfield__glow--signal" />
      <div className="starfield__glow starfield__glow--unity-a" />
      <div className="starfield__glow starfield__glow--unity-b" />
    </div>
  );
}
