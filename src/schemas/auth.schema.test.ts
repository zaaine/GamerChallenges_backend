import { loginSchema, registerSchema } from "./auth.schema.js"

// ============================================================
// TESTS DU SCHEMA DE CONNEXION (loginSchema)
// ============================================================

describe("loginSchema", () => {
  // -- CAS VALIDES --
  it("accepte un email et un mot de passe valides", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "monMotDePasse",
    })
    expect(result.success).toBe(true)
  })

  // -- CAS INVALIDES --
  it("refuse un email invalide", () => {
    const result = loginSchema.safeParse({
      email: "pas-un-email",
      password: "monMotDePasse",
    })
    expect(result.success).toBe(false)
  })

  it("refuse si l'email est absent", () => {
    const result = loginSchema.safeParse({
      password: "monMotDePasse",
    })
    expect(result.success).toBe(false)
  })

  it("refuse si le mot de passe est absent", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// TESTS DU SCHEMA D'INSCRIPTION (registerSchema)
// ============================================================

describe("registerSchema", () => {
  // Données valides de base réutilisées dans les tests
  const validData = {
    pseudo: "GamerPro",
    email: "gamer@example.com",
    password: "MonMotDePasse1!",
    confirm: "MonMotDePasse1!",
    avatar: "",
  }

  // -- CAS VALIDES --

  it("accepte des données d'inscription complètes et valides", () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("accepte un avatar vide (champ optionnel)", () => {
    const result = registerSchema.safeParse({ ...validData, avatar: "" })
    expect(result.success).toBe(true)
  })

  it("accepte un avatar avec une URL d'image valide", () => {
    const result = registerSchema.safeParse({
      ...validData,
      avatar: "https://example.com/avatar.png",
    })
    expect(result.success).toBe(true)
  })

  // -- CAS INVALIDES : PSEUDO --

  it("refuse un pseudo vide", () => {
    const result = registerSchema.safeParse({ ...validData, pseudo: "" })
    expect(result.success).toBe(false)
  })

  it("refuse un pseudo de plus de 50 caractères", () => {
    const result = registerSchema.safeParse({
      ...validData,
      pseudo: "a".repeat(51),
    })
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : MOT DE PASSE --

  it("refuse un mot de passe de moins de 12 caractères", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "Court1!",
    })
    expect(result.success).toBe(false)
  })

  it("refuse un mot de passe sans majuscule", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "monmotdepasse1!",
    })
    expect(result.success).toBe(false)
  })

  it("refuse un mot de passe sans minuscule", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "MONMOTDEPASSE1!",
    })
    expect(result.success).toBe(false)
  })

  it("refuse un mot de passe sans chiffre", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "MonMotDePasse!",
    })
    expect(result.success).toBe(false)
  })

  it("refuse un mot de passe sans caractère spécial", () => {
    const result = registerSchema.safeParse({
      ...validData,
      password: "MonMotDePasse1",
    })
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : AVATAR --

  it("refuse un avatar avec une URL invalide", () => {
    const result = registerSchema.safeParse({
      ...validData,
      avatar: "pas-une-url",
    })
    expect(result.success).toBe(false)
  })

  it("refuse un avatar avec une URL sans extension image", () => {
    const result = registerSchema.safeParse({
      ...validData,
      avatar: "https://example.com/fichier.pdf",
    })
    expect(result.success).toBe(false)
  })
})