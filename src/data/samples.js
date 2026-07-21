const freezeSample = sample => Object.freeze({ ...sample });

export const SAMPLES = Object.freeze([
  freezeSample({ id: "olive-fragment", real: true, title: "Olivový úlomek", text: "Matný povrch, nepravidelné hrany a drobné podélné bubliny." }),
  freezeSample({ id: "bright-green-shard", real: false, title: "Jasně zelený střep", text: "Dokonale hladký povrch, ostrý rovný lom a nepřirozeně sytá barva." }),
  freezeSample({ id: "brown-green-splash", real: true, title: "Hnědozelený splash", text: "Proměnlivá barva, zvlněná skulptace a nestejná tloušťka." }),
  freezeSample({ id: "glossy-cast", real: false, title: "Lesklý odlitek", text: "Stejnoměrná barva, kulaté hrany a opakující se povrchový vzor." }),
  freezeSample({ id: "small-whole-form", real: true, title: "Drobný celotvar", text: "Přirozeně leptaný povrch a jemná průsvitnost proti světlu." }),
  freezeSample({ id: "bottle-glass", real: false, title: "Lahvové sklo", text: "Ploché stěny, pravidelná tloušťka a hladké průmyslové plochy." })
]);

export const SAMPLE_BY_ID = new Map(SAMPLES.map(sample => [sample.id, sample]));

export function getSample(id) {
  return SAMPLE_BY_ID.get(id) ?? null;
}

export function requireSample(id) {
  const sample = getSample(id);
  if (!sample) throw new Error(`Unknown sample: ${id}`);
  return sample;
}
