# node-triplesec

A CommonJS module for symmetric key encryption of smallish secrets

## How to install

```sh
npm install triplesec
```

## How to Use

### One-shot Mode

```coffeescript
{encrypt, decrypt} = require 'triplesec'

key = new Buffer 'top-secret-pw'
pt1 = new Buffer 'the secret!'
encrypt { key, input : pt1 }, (err, ciphtertext) ->
	decrypt { key, input : ciphertext }, (err, pt2) ->
		console.log "Right back the start! #{pt1} is #{pt2}"
```

### Reusable Derived Keys
```coffeescript
{Encryptor, Decryptor} = require 'triplesec'

key = new Buffer 'top-secret-pw'
enc = new Encryptor { key }
dec = new Decryptor { key }
pt0 = new Buffer 'the secret!'
enc.run { input : pt1 }, (err, ct1) ->
	enc.run { input : pt1 }, (err, ct2) ->
		decrypt { key, input : ct1 }, (err, pt1) ->
			decrypt { key, input : ct2 }, (err, pt2) ->
				console.log "Right back the start! #{pt0} is #{pt1} is #{pt2}"
```

If you want to resalt derived keys with every encryption, you should explicitly
ask for that. Otherwise, salt will be reused to speed up encryption
(and decryption).

```coffeescript
enc.run { input : pt1 }, (err, ct1) ->
	resalt {}, () ->
		enc.run { input : pt1 }, (err, ct2) ->
```