import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function getAllowedOrigins() {
    const fromEnv = process.env.CORS_ORIGIN;
    if (fromEnv) {
        return fromEnv
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean);
    }

    return [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3100',
        'http://127.0.0.1:3100',
    ];
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const allowedOrigins = getAllowedOrigins();

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.enableCors({
        origin: (
            origin: string | undefined,
            callback: (error: Error | null, allow?: boolean) => void,
        ) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Quick-Job API running on http://localhost:${port}`);
}
bootstrap();
