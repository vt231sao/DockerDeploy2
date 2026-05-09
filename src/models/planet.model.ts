import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanet extends Document {
    name: string;
    description?: string;
    type: 'Terrestrial' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet';
    massEarth: number;
    // Віртуальне поле
    massKg: string;
    createdAt: Date;
    updatedAt: Date;
}

const PlanetSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Назва планети є обов\'язковою'],
            unique: true,
            trim: true,
            minlength: [1, 'Назва занадто коротка'],
            maxlength: [100, 'Назва занадто довга']
        },
        description: {
            type: String,
            maxlength: [500, 'Опис не може перевищувати 500 символів']
        },
        type: {
            type: String,
            required: true,
            enum: {
                values: ['Terrestrial', 'Gas Giant', 'Ice Giant', 'Dwarf Planet'],
                message: 'Тип {VALUE} не підтримується'
            }
        },
        massEarth: {
            type: Number,
            required: true,
            // КАСТОМНИЙ ВАЛІДАТОР (Завдання 4)
            validate: {
                validator: function (value: number) {
                    if (this.type === 'Dwarf Planet' && value >= 0.1) {
                        return false;
                    }
                    return value > 0;
                },
                message: 'Маса має бути > 0. Для Dwarf Planet маса має бути < 0.1 Землі'
            }
        }
    },
    {
        timestamps: true,

        toJSON: {
            virtuals: true,
            transform: function (doc, ret: Record<string, any>) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        },
        toObject: { virtuals: true }
    }
);

PlanetSchema.virtual('massKg').get(function (this: IPlanet) {
    const earthMassKg = 5.972e24;
    const totalMass = this.massEarth * earthMassKg;
    return `${totalMass.toExponential(2)} kg`;
});

export const Planet = mongoose.model<IPlanet>('Planet', PlanetSchema);