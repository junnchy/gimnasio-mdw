/**
 * Logo de Pulso (manual de marca §02), en SVG y sin imágenes externas.
 *
 * El texto "pulso" usa currentColor: toma el color del texto donde se
 * ponga (text-foreground). El isotipo y el punto cambian solos entre modo
 * claro y oscuro con los colores de la marca.
 *
 * Uso: <Logo className="h-8 w-auto" />  ·  <Logo variante="isotipo" className="size-8" />
 */

type Props = { variante?: "horizontal" | "isotipo"; className?: string };

const PULSO = "M14 54 H33 L41 30 L53 74 L61 46 L67 54 H86";

function Isotipo() {
  return (
    <g>
      <rect width="100" height="100" rx="24" className="fill-pulso-tinta dark:fill-pulso-lima" />
      <path
        d={PULSO}
        fill="none"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-pulso-lima dark:stroke-pulso-tinta"
      />
    </g>
  );
}

export function Logo({ variante = "horizontal", className }: Props) {
  if (variante === "isotipo") {
    return (
      <svg viewBox="0 0 100 100" role="img" aria-label="Pulso" className={className}>
        <Isotipo />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 425.00 100" role="img" aria-label="Pulso" className={className}>
      <Isotipo />
      <g transform="translate(122.22 77.78) scale(0.11111)">
        <path d="M70 200V-496H194V-436H212Q229 -465 265.0 -487.5Q301 -510 368 -510Q428 -510 479.0 -480.5Q530 -451 561.0 -394.0Q592 -337 592 -256V-240Q592 -159 561.0 -102.0Q530 -45 479.0 -15.5Q428 14 368 14Q323 14 292.5 3.5Q262 -7 243.5 -23.5Q225 -40 214 -57H196V200ZM330 -96Q389 -96 427.5 -133.5Q466 -171 466 -243V-253Q466 -325 427.0 -362.5Q388 -400 330 -400Q272 -400 233.0 -362.5Q194 -325 194 -253V-243Q194 -171 233.0 -133.5Q272 -96 330 -96Z" fill="currentColor" />
        <path d="M862.0 8Q804.0 8 760.5 -18.5Q717.0 -45 693.0 -92.0Q669.0 -139 669.0 -200V-496H795.0V-210Q795.0 -154 822.5 -126.0Q850.0 -98 901.0 -98Q959.0 -98 991.0 -136.5Q1023.0 -175 1023.0 -244V-496H1149.0V0H1025.0V-65H1007.0Q995.0 -40 962.0 -16.0Q929.0 8 862.0 8Z" fill="currentColor" />
        <path d="M1254.0 0V-700H1380.0V0Z" fill="currentColor" />
        <path d="M1691.0 14Q1594.0 14 1532.0 -28.0Q1470.0 -70 1457.0 -148L1573.0 -178Q1580.0 -143 1596.5 -123.0Q1613.0 -103 1637.5 -94.5Q1662.0 -86 1691.0 -86Q1735.0 -86 1756.0 -101.5Q1777.0 -117 1777.0 -140Q1777.0 -163 1757.0 -175.5Q1737.0 -188 1693.0 -196L1665.0 -201Q1613.0 -211 1570.0 -228.5Q1527.0 -246 1501.0 -277.0Q1475.0 -308 1475.0 -357Q1475.0 -431 1529.0 -470.5Q1583.0 -510 1671.0 -510Q1754.0 -510 1809.0 -473.0Q1864.0 -436 1881.0 -376L1764.0 -340Q1756.0 -378 1731.5 -394.0Q1707.0 -410 1671.0 -410Q1635.0 -410 1616.0 -397.5Q1597.0 -385 1597.0 -363Q1597.0 -339 1617.0 -327.5Q1637.0 -316 1671.0 -310L1699.0 -305Q1755.0 -295 1800.5 -278.5Q1846.0 -262 1872.5 -231.5Q1899.0 -201 1899.0 -149Q1899.0 -71 1842.5 -28.5Q1786.0 14 1691.0 14Z" fill="currentColor" />
        <path d="M2210.0 14Q2136.0 14 2077.0 -16.0Q2018.0 -46 1984.0 -103.0Q1950.0 -160 1950.0 -240V-256Q1950.0 -336 1984.0 -393.0Q2018.0 -450 2077.0 -480.0Q2136.0 -510 2210.0 -510Q2284.0 -510 2343.0 -480.0Q2402.0 -450 2436.0 -393.0Q2470.0 -336 2470.0 -256V-240Q2470.0 -160 2436.0 -103.0Q2402.0 -46 2343.0 -16.0Q2284.0 14 2210.0 14ZM2210.0 -98Q2268.0 -98 2306.0 -135.5Q2344.0 -173 2344.0 -243V-253Q2344.0 -323 2306.5 -360.5Q2269.0 -398 2210.0 -398Q2152.0 -398 2114.0 -360.5Q2076.0 -323 2076.0 -253V-243Q2076.0 -173 2114.0 -135.5Q2152.0 -98 2210.0 -98Z" fill="currentColor" />
        <path d="M2631.0 14Q2590.0 14 2562.5 -12.5Q2535.0 -39 2535.0 -81Q2535.0 -123 2562.5 -149.5Q2590.0 -176 2631.0 -176Q2671.0 -176 2698.0 -149.5Q2725.0 -123 2725.0 -81Q2725.0 -39 2698.0 -12.5Q2671.0 14 2631.0 14Z" className="fill-pulso-lima-texto dark:fill-pulso-lima" />
      </g>
    </svg>
  );
}
