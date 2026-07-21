const nonEmptyString = value => typeof value === "string" && value.trim().length > 0;

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates];
}

export function validateGameData({ levels, perks, samples } = {}) {
  const errors = [];

  if (!Array.isArray(levels) || levels.length === 0) {
    errors.push("Levels must be a non-empty array.");
  } else {
    const duplicateIds = duplicateValues(levels.map(level => level?.id));
    if (duplicateIds.length) errors.push(`Duplicate level ids: ${duplicateIds.join(", ")}`);

    const duplicateOrders = duplicateValues(levels.map(level => level?.order));
    if (duplicateOrders.length) errors.push(`Duplicate level orders: ${duplicateOrders.join(", ")}`);

    const expectedOrders = levels.map((_, index) => index);
    const actualOrders = levels.map(level => level?.order);
    if (actualOrders.some((order, index) => order !== expectedOrders[index])) {
      errors.push("Level order must be contiguous and match array order starting at zero.");
    }

    const finalLevels = levels.filter(level => level?.final === true);
    if (finalLevels.length !== 1) errors.push("Exactly one level must be marked as final.");
    else if (levels.at(-1) !== finalLevels[0]) errors.push("The final level must be the last level.");

    for (const level of levels) {
      const prefix = `Level ${level?.id ?? "(missing id)"}`;
      for (const field of ["id", "name", "title", "theme", "music", "text", "goal"]) {
        if (!nonEmptyString(level?.[field])) errors.push(`${prefix} has invalid ${field}.`);
      }

      if (!Array.isArray(level?.objectives) || level.objectives.length === 0) {
        errors.push(`${prefix} must define at least one objective.`);
      } else {
        const duplicateObjectiveIds = duplicateValues(level.objectives.map(objective => objective?.id));
        if (duplicateObjectiveIds.length) {
          errors.push(`${prefix} has duplicate objective ids: ${duplicateObjectiveIds.join(", ")}`);
        }
        for (const objective of level.objectives) {
          if (!nonEmptyString(objective?.id) || !nonEmptyString(objective?.type) || !nonEmptyString(objective?.target)) {
            errors.push(`${prefix} contains an invalid objective.`);
          }
          if (!Number.isInteger(objective?.required) || objective.required < 1) {
            errors.push(`${prefix} objective ${objective?.id ?? "(missing id)"} must require a positive integer.`);
          }
        }
      }

      if (!Array.isArray(level?.hazards)) errors.push(`${prefix} hazards must be an array.`);
    }
  }

  if (!Array.isArray(perks) || perks.length === 0) {
    errors.push("Perks must be a non-empty array.");
  } else {
    const duplicateIds = duplicateValues(perks.map(perk => perk?.id));
    if (duplicateIds.length) errors.push(`Duplicate perk ids: ${duplicateIds.join(", ")}`);
    for (const perk of perks) {
      if (!nonEmptyString(perk?.id) || !nonEmptyString(perk?.name) || !nonEmptyString(perk?.text)) {
        errors.push(`Invalid perk definition: ${perk?.id ?? "(missing id)"}.`);
      }
      if (!Number.isInteger(perk?.max) || perk.max < 1) errors.push(`Perk ${perk?.id ?? "(missing id)"} has invalid max.`);
    }
  }

  if (!Array.isArray(samples) || samples.length < 2) {
    errors.push("Samples must contain at least two entries.");
  } else {
    const duplicateIds = duplicateValues(samples.map(sample => sample?.id));
    if (duplicateIds.length) errors.push(`Duplicate sample ids: ${duplicateIds.join(", ")}`);
    if (!samples.some(sample => sample?.real === true)) errors.push("Samples must include at least one real moldavite.");
    if (!samples.some(sample => sample?.real === false)) errors.push("Samples must include at least one false sample.");
    for (const sample of samples) {
      if (!nonEmptyString(sample?.id) || !nonEmptyString(sample?.title) || !nonEmptyString(sample?.text) || typeof sample?.real !== "boolean") {
        errors.push(`Invalid sample definition: ${sample?.id ?? "(missing id)"}.`);
      }
    }
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}

export function assertValidGameData(data) {
  const result = validateGameData(data);
  if (!result.valid) {
    const error = new Error(`Invalid game data:\n- ${result.errors.join("\n- ")}`);
    error.name = "GameDataValidationError";
    error.errors = result.errors;
    throw error;
  }
  return data;
}
