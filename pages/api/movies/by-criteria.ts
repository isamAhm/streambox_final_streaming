import { NextApiRequest, NextApiResponse } from 'next';
import prismadb from '@/libs/prismadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).end();
    }

    try {
        const {
            category = 'oscar-nominees',
            type = 'movie',
            limit = '20'
        } = req.query;

        let whereClause: any = {
            type: type as string,
        };

        // Define criteria based on category
        switch (category) {
            case 'oscar-nominees':
                // Oscar nominees typically have ratings 7.5+ and from specific years
                whereClause = {
                    ...whereClause,
                    rating: { gte: 7.5 },
                    genre: {
                        in: ['Drama', 'Biography', 'Historical'],
                        mode: 'insensitive',
                    },
                };
                break;

            case 'psychological-thrillers':
                whereClause = {
                    ...whereClause,
                    genre: {
                        contains: 'Thriller',
                        mode: 'insensitive',
                    },
                    rating: { gte: 7.0 },
                };
                break;

            case 'cannes-festival':
                // Cannes films are typically art-house, high-rated dramas
                whereClause = {
                    ...whereClause,
                    rating: { gte: 7.5 },
                    genre: {
                        in: ['Drama', 'Romance', 'Mystery'],
                        mode: 'insensitive',
                    },
                };
                break;

            case 'halloween':
                whereClause = {
                    ...whereClause,
                    genre: {
                        in: ['Horror', 'Thriller', 'Mystery'],
                        mode: 'insensitive',
                    },
                };
                break;

            case 'based-on-true-story':
                whereClause = {
                    ...whereClause,
                    genre: {
                        in: ['Biography', 'Documentary', 'Historical', 'Crime'],
                        mode: 'insensitive',
                    },
                    rating: { gte: 7.0 },
                };
                break;

            case 'mindfck':
                whereClause = {
                    ...whereClause,
                    genre: {
                        in: ['Thriller', 'Mystery', 'Sci-Fi', 'Psychological'],
                        mode: 'insensitive',
                    },
                    rating: { gte: 7.5 },
                };
                break;

            case 'rotten-tomatoes-best':
                whereClause = {
                    ...whereClause,
                    rating: { gte: 8.5 },
                };
                break;

            default:
                break;
        }

        const content = await prismadb.movie.findMany({
            where: whereClause,
            orderBy: [
                { rating: 'desc' },
                { popularity: 'desc' },
            ],
            take: parseInt(limit as string),
        });

        return res.status(200).json(content);
    } catch (error) {
        console.error('[BY_CRITERIA_ERROR]', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
