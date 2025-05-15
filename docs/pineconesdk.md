# Python SDK

The Pinecone Python SDK is distributed on PyPI using the package name `pinecone`. By default, the `pinecone` package has a minimal set of dependencies and interacts with Pinecone via HTTP requests. However, you can install the following extras to unlock additional functionality:

* `pinecone[grpc]` adds dependencies on `grpcio` and related libraries needed to run data operations such as upserts and queries over [gRPC](https://grpc.io/) for a modest performance improvement.

* `pinecone[asyncio]` adds a dependency on `aiohttp` and enables usage of `async` methods for use with [asyncio](https://docs.python.org/3/library/asyncio.html). For more details, see [Asyncio support](#async-requests).

<Tip>
  See the [Pinecone Python SDK
  documentation](https://sdk.pinecone.io/python/pinecone.html)
  for full installation instructions, usage examples, and reference information.

  To make a feature request or report an issue, please [file an issue](https://github.com/pinecone-io/pinecone-java-client/issues).
</Tip>

## Requirements

The Pinecone Python SDK requires Python 3.9 or later. It has been tested with CPython versions from 3.9 to 3.13.

## SDK versions

SDK versions are pinned to specific [API versions](/reference/api/versioning). When a new API version is released, a new version of the SDK is also released.

The mappings between API versions and Python SDK versions are as follows:

| API version                   | SDK version      |
| :---------------------------- | :--------------- |
| `2025-04` (release candidate) | Not yet released |
| `2025-01` (latest)            | v6.x             |
| `2024-10`                     | v5.3.x           |
| `2024-07`                     | v5.0.x-v5.2.x    |
| `2024-04`                     | v4.x             |

When a new stable API version is released, you should upgrade your SDK to the latest version to ensure compatibility with the latest API changes.

## Install

To install the latest version of the [Python SDK](https://github.com/pinecone-io/pinecone-python-client), run the following command:

```shell
# Install the latest version
pip install pinecone

# Install the latest version with gRPC extras
pip install "pinecone[grpc]"

# Install the latest version with asyncio extras
pip install "pinecone[asyncio]"
```

To install a specific version of the Python SDK, run the following command:

```shell pip
# Install a specific version
pip install pinecone==<version>

# Install a specific version with gRPC extras
pip install "pinecone[grpc]"==<version>

# Install a specific version with asyncio extras
pip install "pinecone[asyncio]"==<version>
```

To check your SDK version, run the following command:

```shell pip
pip show pinecone
```

<Note>
  To use the [Inference API](/guides/inference/understanding-inference), you must be on version 5.0.0 or later.
</Note>

### Install the Pinecone Assistant Python plugin

To interact with [Pinecone Assistant](/guides/assistant/overview) using the [Python SDK](/reference/python-sdk), upgrade the client and install the `pinecone-plugin-assistant` package as follows:

```shell HTTP
pip install --upgrade pinecone pinecone-plugin-assistant
```

## Upgrade

<Warning>
  Before upgrading to `v6.0.0`, update all relevant code to account for the breaking changes explained [here](https://github.com/pinecone-io/pinecone-python-client/blob/main/docs/upgrading.md).

  Also, make sure to upgrade using the `pinecone` package name instead of `pinecone-client`; upgrading with the latter will not work as of `v6.0.0`.
</Warning>

If you already have the Python SDK, upgrade to the latest version as follows:

```shell
# Upgrade to the latest version
pip install pinecone --upgrade

# Upgrade to the latest version with gRPC extras
pip install "pinecone[grpc]" --upgrade

# Upgrade to the latest version with asyncio extras
pip install "pinecone[asyncio]" --upgrade
```

## Initialize

Once installed, you can import the library and then use an [API key](/guides/projects/manage-api-keys) to initialize a client instance:

<CodeGroup>
  ```Python HTTP
  from pinecone import Pinecone

  pc = Pinecone(api_key="YOUR_API_KEY")
  ```

  ```python gRPC
  from pinecone.grpc import PineconeGRPC as Pinecone

  pc = Pinecone(api_key="YOUR_API_KEY")
  ```
</CodeGroup>

When [creating an index](/guides/indexes/create-an-index), import the `ServerlessSpec` or `PodSpec` class as well:

<CodeGroup>
  ```Python Serverless index
  from pinecone.grpc import PineconeGRPC as Pinecone
  from pinecone import ServerlessSpec

  pc = Pinecone(api_key="YOUR_API_KEY")

  pc.create_index(
    name="example-index",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(
      cloud="aws",
      region="us-east-1"
    )
  )
  ```

  ```Python Pod-based index
  from pinecone.grpc import PineconeGRPC as Pinecone
  from pinecone import PodSpec

  pc = Pinecone(api_key="YOUR_API_KEY")

  pc.create_index(
    name="example-index",
    dimension=1536,
    metric="cosine",
    spec=PodSpec(
      environment="us-west-1-gcp",
      pod_type="p1.x1",
      pods=1
    )
  )
  ```
</CodeGroup>

## Proxy configuration

If your network setup requires you to interact with Pinecone through a proxy, you will need to pass additional configuration using optional keyword parameters:

* `proxy_url`: The location of your proxy. This could be an HTTP or HTTPS URL depending on your proxy setup.
* `proxy_headers`: Accepts a python dictionary which can be used to pass any custom headers required by your proxy. If your proxy is protected by authentication, use this parameter to pass basic authentication headers with a digest of your username and password. The `make_headers` utility from `urllib3` can be used to help construct the dictionary. **Note:** Not supported with Asyncio.
* `ssl_ca_certs`: By default, the client will perform SSL certificate verification using the CA bundle maintained by Mozilla in the [`certifi`](https://pypi.org/project/certifi/) package. If your proxy is using self-signed certicates, use this parameter to specify the path to the certificate (PEM format).
* `ssl_verify`: SSL verification is enabled by default, but it is disabled when set to `False`. It is not recommened to go into production with SSL verification disabled.

<CodeGroup>
  ```python HTTP
  from pinecone import Pinecone
  import urllib3 import make_headers

  pc = Pinecone(
      api_key="YOUR_API_KEY",
      proxy_url='https://your-proxy.com',
      proxy_headers=make_headers(proxy_basic_auth='username:password'),
      ssl_ca_certs='path/to/cert-bundle.pem'
  )
  ```

  ```python gRPC
  from pinecone.grpc import PineconeGRPC as Pinecone
  import urllib3 import make_headers

  pc = Pinecone(
      api_key="YOUR_API_KEY",
      proxy_url='https://your-proxy.com',
      proxy_headers=make_headers(proxy_basic_auth='username:password'),
      ssl_ca_certs='path/to/cert-bundle.pem'
  )
  ```

  ```python asyncio
  import asyncio
  from pinecone import PineconeAsyncio
  	
  async def main():
      async with PineconeAsyncio(
          api_key="YOUR_API_KEY",
          proxy_url='https://your-proxy.com',
          ssl_ca_certs='path/to/cert-bundle.pem'
      ) as pc:
          # Do async things
          await pc.list_indexes()

  asyncio.run(main())
  ```
</CodeGroup>

## Async requests

Pinecone Python SDK versions 6.0.0 and later provide `async` methods for use with [asyncio](https://docs.python.org/3/library/asyncio.html). Asyncio support makes it possible to use Pinecone with modern async web frameworks such as [FastAPI](https://fastapi.tiangolo.com/), [Quart](https://quart.palletsprojects.com/en/latest/), and [Sanic](https://sanic.dev/en/), and should significantly increase the efficiency of running requests in parallel.

Use the [`PineconeAsyncio`](https://sdk.pinecone.io/python/pinecone/control/pinecone_asyncio.html#PineconeAsyncio) class to create and manage indexes and the [`IndexAsyncio`](https://sdk.pinecone.io/python/pinecone/control/pinecone_asyncio.html#PineconeAsyncio.IndexAsyncio) class to read and write index data. To ensure that sessions are properly closed, use the `async with` syntax when creating `PineconeAsyncio` and `IndexAsyncio` objects.

<CodeGroup>
  ```python Manage indexes
  # pip install "pinecone[asyncio]"
  import asyncio
  from pinecone import PineconeAsyncio, ServerlessSpec

  async def main():
      async with PineconeAsyncio(api_key="YOUR_API_KEY") as pc:
          if not await pc.has_index(index_name):
              desc = await pc.create_index(
                  name="example-index",
                  dimension=1536,
                  metric="cosine",
                  spec=ServerlessSpec(
                      cloud="aws",
                      region="us-east-1"
                  ),
                  deletion_protection="disabled",
                  tags={
                      "environment": "development"
                  }
              )

  asyncio.run(main())
  ```

  ```python Read and write index data
  # pip install "pinecone[asyncio]"
  import asyncio
  from pinecone import Pinecone

  async def main():
      pc = Pinecone(api_key="YOUR_API_KEY")
      async pc.IndexAsyncio(host="INDEX_HOST") as idx:
          await idx.upsert_records(
              namespace="example-namespace",
              records=[
                  {
                      "id": "1",
                      "title": "The Great Gatsby",
                      "author": "F. Scott Fitzgerald",
                      "description": "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
                      "year": 1925,
                  },
                  {
                      "id": "2",
                      "title": "To Kill a Mockingbird",
                      "author": "Harper Lee",
                      "description": "A young girl comes of age in the segregated American South and witnesses her father's courageous defense of an innocent black man.",
                      "year": 1960,
                  },
                  {
                      "id": "3",
                      "title": "1984",
                      "author": "George Orwell",
                      "description": "In a dystopian future, a totalitarian regime exercises absolute control through pervasive surveillance and propaganda.",
                      "year": 1949,
                  },
              ]
          )

  asyncio.run(main())
  ```
</CodeGroup>