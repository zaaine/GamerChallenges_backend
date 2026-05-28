import { challengeSchema } from "./challenge.schema.js"

// ============================================================
// TESTS DU SCHEMA DE CHALLENGE (challengeSchema)
// ============================================================

describe("challengeSchema", () => {
  // Données valides de base réutilisées dans les tests
  const validData = {
    title: "Mon super challenge",
    description: "Une description suffisamment longue pour être valide",
    rules: "Les règles du challenge sont suffisamment longues",
    game_title: "Super Mario",
    game_id: "123",
  }

  // -- CAS VALIDES --

  it("accepte des données de challenge complètes et valides", () => {
    const result = challengeSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("accepte un challenge sans game_id (champ optionnel)", () => {
    const { game_id, ...withoutGameId } = validData
    const result = challengeSchema.safeParse(withoutGameId)
    expect(result.success).toBe(true)
  })

  // -- CAS INVALIDES : TITLE --

  it("refuse un titre de moins de 3 caractères", () => {
    const result = challengeSchema.safeParse({ ...validData, title: "ab" })
    expect(result.success).toBe(false)
  })

  it("refuse un titre vide", () => {
    const result = challengeSchema.safeParse({ ...validData, title: "" })
    expect(result.success).toBe(false)
  })

  it("refuse si le titre est absent", () => {
    const { title, ...withoutTitle } = validData
    const result = challengeSchema.safeParse(withoutTitle)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : DESCRIPTION --

  it("refuse une description de moins de 10 caractères", () => {
    const result = challengeSchema.safeParse({
      ...validData,
      description: "Court",
    })
    expect(result.success).toBe(false)
  })

  it("refuse une description contenant une balise <script>", () => {
    const result = challengeSchema.safeParse({
      ...validData,
      description: "<script>alert('xss')</script>",
    })
    expect(result.success).toBe(false)
  })

  it("refuse si la description est absente", () => {
    const { description, ...withoutDescription } = validData
    const result = challengeSchema.safeParse(withoutDescription)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : RULES --

  it("refuse des règles de moins de 10 caractères", () => {
    const result = challengeSchema.safeParse({
      ...validData,
      rules: "Court",
    })
    expect(result.success).toBe(false)
  })

  it("refuse des règles contenant une balise <script>", () => {
    const result = challengeSchema.safeParse({
      ...validData,
      rules: "<script>alert('xss')</script>",
    })
    expect(result.success).toBe(false)
  })

  it("refuse des règles avec une balise script avec attributs", () => {
    const result = challengeSchema.safeParse({
      ...validData,
      rules: '<script type="text/javascript">alert("xss")</script>',
    })
    expect(result.success).toBe(false)
  })

  it("refuse si les règles sont absentes", () => {
    const { rules, ...withoutRules } = validData
    const result = challengeSchema.safeParse(withoutRules)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : GAME_TITLE --

  it("refuse si game_title est absent", () => {
    const { game_title, ...withoutGameTitle } = validData
    const result = challengeSchema.safeParse(withoutGameTitle)
    expect(result.success).toBe(false)
  })
})