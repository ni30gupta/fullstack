FROM python:3.12-slim

# ARG UID=1000
# ARG GID=1000

# RUN groupadd -g $GID appuser \
#     && useradd -m -u $UID -g $GID appuser


RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		vim \
		postgresql-client \
		binutils \
		libproj-dev \
		gdal-bin \
		libgdal-dev \
	&& rm -rf /var/lib/apt/lists/*


WORKDIR /app

# USER appuser`

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
