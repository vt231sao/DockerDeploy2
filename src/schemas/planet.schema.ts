import {z} from "zod";

const PLANET_TYPES = ['Terrestrial', 'Gas Giant', 'Ice Giant', 'Dwarf Planet'] as const;

// Post запит
export const createPlanetSchema = z.object({
    name: z.string().min(1, "Назва планети не може бути порожньою").max(100, 'Назва занадто довга'),
    description: z.string().max(500, "Опис занадто довгий").optional(),

    type: z.enum(PLANET_TYPES, {
        message: "Допустимі типи: Terrestrial, Gas Giant, Ice Giant, Dwarf Planet"
    }),
        // Маса відносно Землі (Земля = 1).
    massEarth: z.number().positive("Маса має бути більшою за 0"),
});
// Patch запит
export const updatePlanetSchema = createPlanetSchema.partial();

export type CreatePlanetInput = z.infer<typeof createPlanetSchema>;
export type UpdatePlanetInput = z.infer<typeof updatePlanetSchema>;

export type PlanetEntity = CreatePlanetInput & {
    id: string,
    createdAt: Date,
    updatedAt: Date
}