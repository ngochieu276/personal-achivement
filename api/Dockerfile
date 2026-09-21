FROM denoland/deno:2.9.6

WORKDIR /app

COPY deno.json prisma.config.ts ./
COPY prisma ./prisma
COPY . .

# Prisma generate does not need a live database. Do not persist DATABASE_URL
# on the image — Fly secrets must supply it at runtime.
ARG PRISMA_GENERATE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres"
RUN DATABASE_URL="${PRISMA_GENERATE_URL}" deno install --allow-scripts=npm:prisma,npm:@prisma/engines
RUN DATABASE_URL="${PRISMA_GENERATE_URL}" deno task db:generate
RUN deno cache main.ts

EXPOSE 8080

CMD ["deno", "run", "-A", "main.ts"]
