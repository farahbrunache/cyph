#!/bin/bash

cd $(cd "$(dirname "$0")"; pwd)/..
dir="$PWD"
cd shared/lib/js

if diff yarn.lock node_modules/yarn.lock > /dev/null 2>&1 ; then
	exit 0
fi

rm -rf node_modules ../.js.tmp 2> /dev/null

cd ..
cp -a js .js.tmp
cd .js.tmp

git init
mkdir node_modules
yarn install --ignore-platform || exit 1

cd node_modules

cp -a ../libsodium ./

mkdir -p @types/libsodium
cat > @types/libsodium/index.d.ts << EOM
interface ISodium {
	crypto_aead_chacha20poly1305_ABYTES: number;
	crypto_aead_chacha20poly1305_KEYBYTES: number;
	crypto_aead_chacha20poly1305_NPUBBYTES: number;
	crypto_box_NONCEBYTES: number;
	crypto_box_PUBLICKEYBYTES: number;
	crypto_box_SECRETKEYBYTES: number;
	crypto_onetimeauth_BYTES: number;
	crypto_onetimeauth_KEYBYTES: number;
	crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE: number;
	crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE: number;
	crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_SENSITIVE: number;
	crypto_pwhash_scryptsalsa208sha256_SALTBYTES: number;
	crypto_scalarmult_BYTES: number;
	crypto_scalarmult_SCALARBYTES: number;

	crypto_aead_chacha20poly1305_decrypt (
		secretNonce: Uint8Array|undefined,
		cyphertext: Uint8Array,
		additionalData: Uint8Array|undefined,
		publicNonce: Uint8Array,
		key: Uint8Array
	) : Uint8Array;
	crypto_aead_chacha20poly1305_encrypt (
		plaintext: Uint8Array,
		additionalData: Uint8Array|undefined,
		secretNonce: Uint8Array|undefined,
		publicNonce: Uint8Array,
		key: Uint8Array
	) : Uint8Array;
	crypto_box_keypair () : {privateKey: Uint8Array; publicKey: Uint8Array};
	crypto_box_seal (plaintext: Uint8Array, publicKey: Uint8Array) : Uint8Array;
	crypto_box_seal_open (
		cyphertext: Uint8Array,
		publicKey: Uint8Array,
		privateKey: Uint8Array
	) : Uint8Array;
	crypto_generichash (
		outputBytes: number,
		plaintext: Uint8Array,
		key?: Uint8Array
	) : Uint8Array;
	crypto_onetimeauth (
		message: Uint8Array,
		key: Uint8Array
	) : Uint8Array;
	crypto_onetimeauth_verify (
		mac: Uint8Array,
		message: Uint8Array,
		key: Uint8Array
	) : boolean;
	crypto_pwhash_scryptsalsa208sha256 (
		keyBytes: number,
		password: Uint8Array,
		salt: Uint8Array,
		opsLimit: number,
		memLimit: number
	) : Uint8Array;
	crypto_scalarmult (privateKey: Uint8Array, publicKey: Uint8Array) : Uint8Array;
	crypto_scalarmult_base (privateKey: Uint8Array) : Uint8Array;
	crypto_stream_chacha20 (
		outLength: number,
		key: Uint8Array,
		nonce: Uint8Array
	) : Uint8Array;
	from_base64 (s: string) : Uint8Array;
	from_hex (s: string) : Uint8Array;
	from_string (s: string) : Uint8Array;
	memcmp (a: Uint8Array, b: Uint8Array) : boolean;
	memzero (a: Uint8Array) : void;
	to_base64 (a: Uint8Array) : string;
	to_hex (a: Uint8Array) : string;
	to_string (a: Uint8Array) : string;
};

declare const sodium: ISodium;
EOM

for anyType in konami-code.js markdown-it-emoji markdown-it-sup simplewebrtc tab-indent wowjs ; do
	mkdir -p "@types/${anyType}"
	echo "
		declare module '${anyType}' {
			declare const balls: any;
			export = balls;
		}
	" > "@types/${anyType}/index.d.ts"
done

echo 'declare module "braintree-web" { export = braintree; }' >> @types/braintree-web/index.d.ts

find . -type f | grep -P '.*\.min\.[a-z]+$' | xargs -I% bash -c '
	cp -f "%" "$(echo "%" | perl -pe "s/\.min(\.[a-z]+)$/\1/")"
'

for f in \
	Base64/base64.js \
	jquery.appear/jquery.appear.js \
	nanoscroller/bin/javascripts/jquery.nanoscroller.jss \
	whatwg-fetch/fetch.js
do
	uglifyjs "${f}" -m -o "${f}"
done

for module in mceliece-js ntru rlwe sidh sphincs supersphincs ; do
	sed -i 's|export const|declare const|g' ${module}/*.d.ts
	sed -i 's|export ||g' ${module}/*.d.ts
done

for arr in \
	'konami-code.js/konami.js Konami' \
	'tab-indent/js/tabIndent.js tabIndent' \
	'wowjs/dist/wow.js this.WOW'
do
	read -ra arr <<< "${arr}"
	echo "module.exports = ${arr[1]};" >> "${arr[0]}"
done

sed -i 's/saveAs\s*||/self.saveAs||/g' file-saver/*.js

sed -i "s|require('./socketioconnection')|null|g" simplewebrtc/simplewebrtc.js

cat wowjs/dist/wow.js | perl -pe 's/this\.([A-Z][a-z])/self.\1/g' > wowjs/dist/wow.js.new
mv wowjs/dist/wow.js.new wowjs/dist/wow.js

cd firebase
cp -f ../../module_locks/firebase/* ./
mkdir node_modules
yarn install
browserify firebase-node.js -o firebase.tmp.js -s firebase
cat firebase.tmp.js |
	sed 's|https://apis.google.com||g' |
	sed 's|iframe||gi' |
	perl -pe "s/[A-Za-z0-9]+\([\"']\/js\/.*?.js.*?\)/null/g" \
> firebase.js
cp -f firebase.js firebase-browser.js
cp -f firebase.js firebase-node.js
rm -rf firebase.tmp.js node_modules
cd ..

cd ../..

mv .js.tmp/node_modules js/
rm -rf .js.tmp
cp js/yarn.lock js/node_modules/


# Go libs

rm -rf go 2> /dev/null
mkdir go
cd go

mkdir github.com
cd github.com

mkdir gorilla
cd gorilla
${dir}/commands/libclone.sh https://github.com/gorilla/context.git
${dir}/commands/libclone.sh https://github.com/gorilla/mux.git
cd ..

mkdir lionelbarrow
cd lionelbarrow
${dir}/commands/libclone.sh https://github.com/lionelbarrow/braintree-go.git
echo '
func (g *Braintree) SetHTTPClient(client *http.Client) {
	g.HttpClient = client
}' >> braintree-go/braintree.go # Temporary workaround for GAE support
cd ..

mkdir microcosm-cc
cd microcosm-cc
${dir}/commands/libclone.sh https://github.com/microcosm-cc/bluemonday.git
cd ..

cd ..

mkdir -p golang.org/x
cd golang.org/x

${dir}/commands/libclone.sh https://github.com/golang/net.git net.tmp
mkdir net
cd net.tmp
mv AUTHORS CONTRIBUTING.md CONTRIBUTORS LICENSE PATENTS README html context ../net/
cd ..
rm -rf net.tmp

${dir}/commands/libclone.sh https://github.com/golang/text.git

${dir}/commands/libclone.sh https://github.com/golang/tools.git tools-tmp
mkdir -p tools/go
cd tools-tmp
mv AUTHORS CONTRIBUTING.md CONTRIBUTORS LICENSE PATENTS README ../tools
cd go
mv ast buildutil loader ../../tools/go/
cd ../..
rm -rf tools-tmp
find tools -name '*test*' -exec rm -rf {} \; 2> /dev/null

cd ../..

find . -name .git -exec rm -rf {} \; 2> /dev/null
find . -type f -name '*_test.go' -exec rm {} \;
find . -type f -name '*.go' -exec sed -i 's|func main|func functionRemoved|g' {} \;

for d in * ; do
	rm -rf ../../default/${d} 2> /dev/null
	cp -rf ${d} ../../default/
done
