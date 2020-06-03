FROM hayd/alpine-deno:1.0.0

ENV TZ=Australia/Perth
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app
USER deno

COPY ./src/ /app/src/

RUN deno cache --unstable ./src/main.ts

CMD ["--unstable", "--allow-read", "--allow-net", "/app/src/main.ts"]
