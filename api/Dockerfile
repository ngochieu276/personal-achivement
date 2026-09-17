FROM denoland/deno:2.9.6

WORKDIR /app

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_record?schema=public"

COPY deno.json prisma.config.ts ./
COPY prisma ./prisma
COPY . .

RUN deno install --allow-scripts=npm:prisma,npm:@prisma/engines
RUN deno task db:generate
RUN deno cache main.ts

EXPOSE 8080

CMD ["deno", "run", "-A", "main.ts"]
