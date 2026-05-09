import { Planet, IPlanet } from '../models/planet.model';
import { CreatePlanetInput, UpdatePlanetInput } from '../schemas/planet.schema';

export interface PlanetFilters {
    type?: string;
    minMassEarth?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
}

export const PlanetStorage = {
    async getAll(filters?: PlanetFilters): Promise<IPlanet[]> {
        const query: any = {};

        if (filters?.type) query.type = filters.type;
        if (filters?.minMassEarth !== undefined) {
            query.massEarth = { $gte: Number(filters.minMassEarth) }; // gte >=
        }

        let mongooseQuery = Planet.find(query);

        if (filters?.sortBy) {
            mongooseQuery = mongooseQuery.sort(filters.sortBy);
        } else {
            mongooseQuery = mongooseQuery.sort('-createdAt');
        }

        // Пагінація
        const page = filters?.page ? Number(filters.page) : 1;
        const limit = filters?.limit ? Number(filters.limit) : 10;
        const skip = (page - 1) * limit;

        mongooseQuery = mongooseQuery.skip(skip).limit(limit);

        return await mongooseQuery.exec();
    },

    async getById(id: string): Promise<IPlanet | null> {
        return await Planet.findById(id).exec();
    },

    async create(data: CreatePlanetInput): Promise<IPlanet> {
        const newPlanet = new Planet(data);
        return await newPlanet.save();
    },

    async update(id: string, data: UpdatePlanetInput): Promise<IPlanet | null> {
        return await Planet.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
    },

    async delete(id: string): Promise<boolean> {
        const result = await Planet.findByIdAndDelete(id).exec();
        return result !== null;
    },

};