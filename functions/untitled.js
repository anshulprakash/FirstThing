const admin = require("firebase-admin");

let serviceAccount = {
	  "type": "service_account",
	  "project_id": "vml-mobi-first-thing",
	  "private_key_id": "2ac9f16390cc3ebd20a2c31ee5056fea228a0bc0",
	  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGNqz60headjlk\n8OGzGasvqkG5bhfoH7qiGMv3Jrew4vFAip/ZjVlPxoaJtPL1MBz7D1MvA929XKFm\nd7Pr+3Gz6F38gJ5Na+WsIHrXzji7PRosYKtoy5gb/D/by06p21UKXU/2zG8VJo2H\nbtCawwWJpVcjNBCrs6oeekJqm/KS3V9ZlWF7UTcVwgzgm5deKTVODyrMJBFD5FKD\nPWejC9urVC7g+LIKc6sh66jxZj+ifshhCOPGH8+6/3d3JgHnVSFpoBjxuZwvwA+d\nOqzf1H25nF/7w0snWo9Vf3e38gJSJFqyfnYOw75ri8e5P7oktjj/7e8Lllr7n1MW\niWxPf+53AgMBAAECggEAJf8HK9GoSqjNGcd/TIjoIuv9S2GKXanvafFc8BTQ86yd\nWKT6PYb2Du/cjHtOc6f0dkAazxFrqUgffHgH2n3J7xXlJmk1b1v2nAdh5QqYH3R4\nFve1BBK7Juo1B5oyiycLZ0A5+vJ3fNN2H/cjL/egkSFL0ejCJVf8jXkcUDlyx6on\nn0JHMtZs74Zhzn4ROGgXuNf2Z9I6G8vY+ACIrZoFoDQnTGwcYsRkHBcjatuHYoww\nt3HCfJKFpCTmYk4r4wqa4cMySMhGYxc+IZse3/sVbm55HHj9XfllwworUan91Rcc\nn/pRSEhMbwayavrQPmuYK0Mec7WEGnGUwJyD+PfG8QKBgQDnTzIerWrgYP8waoai\ndFIlZ/k9FDh8AXufQECQjvPItOLb84K1CpQW4jh7E3wdMEd5dGGAFCp/MtDBXUXO\nX7c7cbaV5DSFz9UtzMe8EAuSxXepuEDvfiOXm65M8yP5TgNxixsNPpLk0eFppn5/\nFTLa+nUQUXiEckPZGBlJNFmjGQKBgQDbXxkjr5DMpqIbrJf9EzhSAQfnZ+f1Eq+t\n3WBO6iSu2Cqf9mC34dd95869QxGPR52jQM1qNYjH3kP5dtiYvU0K8hpgMAxJjhRi\n2K0g4TAZm3Fmq8xUtovYMXlVZscTkeUB3qR9PUymgfwCoGSHojulxdP2XkGf2D6J\namQ5koZgDwKBgQCdGk0QSPiuLTMlzzRiYl7oyRWfRnyWvOsZ3qn7hRxO1Yy/l0TP\ncb/jSwLRlQpXSNNCyqjuNMQoYHso2hDvelMZLMK2S6jguagw00VVlhBGP5hmzZ5N\nC39hGXvpB7sHONVd6P0WocljYKmY+FwyNFO2JyYbTzprurAaYyPJdKTtAQKBgBD3\nqQ0ejjeWB+HWFqdnbirBk6ftXH6TJG1xOvq/l3jClYFr4A049Z7yaAYxgtEvO90d\nrQWzAFJdOaq464Xc1nGrSij4bmreB2uh0LpDUKIaaMoFLbe7qtNc+EKHwYwc87aS\nTuy06hHS6fgWCdCH1s86nutmXPMNGcEtLnVZhPU3AoGAZ5hOmqetDvTbVijZHryt\nL+rjcPDTsEetn4BUAxhoasdAbL7XDbnuFH893jm4Ted1ciUj50uFxvRlCiY97yT/\n18grE1whczQGAcnZrDQSZxLT8hUljuibkUCz3VmRj21wvWXicaJwyCmuVlAnKtXM\no8R8oez5gM40vZS+fqsva9w=\n-----END PRIVATE KEY-----\n",
	  "client_email": "firebase-adminsdk-el5dl@vml-mobi-first-thing.iam.gserviceaccount.com",
	  "client_id": "104918217062942236554",
	  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
	  "token_uri": "https://accounts.google.com/o/oauth2/token",
	  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
	  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-el5dl%40vml-mobi-first-thing.iam.gserviceaccount.com"
	};
const DATABASE_ACCESS_TOKEN  = admin.credential.cert(serviceAccount).getAccessToken().access_token;