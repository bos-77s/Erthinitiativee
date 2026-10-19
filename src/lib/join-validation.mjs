const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const interests = new Set(["academic", "community", "both"]);

function validText(value, minimum, maximum) {
  return typeof value === "string" && value.trim().length >= minimum && value.trim().length <= maximum;
}

export function validateJoinApplication(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_request" };
  }
  if (
    !validText(body.name, 2, 100) ||
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !emailPattern.test(body.email.trim()) ||
    !interests.has(body.interest) ||
    !validText(body.motivation, 20, 2000) ||
    body.consent !== true
  ) {
    return { ok: false, error: "invalid_fields" };
  }

  return {
    ok: true,
    value: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      interest: body.interest,
      motivation: body.motivation.trim(),
    },
  };
}
