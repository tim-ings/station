FROM python:3.8.3-alpine3.11

ENV TZ=Australia/Perth
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ./src/ ./src/

COPY ./time_tables/four/ ./time_tables

WORKDIR /app/src

CMD ["/bin/sh", "/app/src/run.sh"]
