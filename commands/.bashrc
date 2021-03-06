# Sourced by bashrc within Docker

bindmount () {
	if [ "${CIRCLECI}" ] ; then
		rm -rf "${2}" 2> /dev/null
		cp -a "${1}" "${2}"
	else
		mkdir "${2}" 2> /dev/null
		sudo mount --bind "${1}" "${2}"
	fi
}

checkfail () {
	if (( $? )) ; then
		fail "${*}"
	fi
}

download () {
	curl -s --compressed --retry 50 ${1} > ${2}
}

easyoptions () {
	source ~/easyoptions/easyoptions
}

fail () {
	if [ "${*}" ] ; then
		log "${*}\n\nFAIL"
	else
		log 'FAIL'
	fi
	exit 1
}

log () {
	echo -e "\n\n\n${*} ($(date))\n"
}

# Workaround for https://github.com/angular/angular-cli/issues/10529
ng () {
	node --max_old_space_size=8000 ./node_modules/@angular/cli/bin/ng "${@}"
}

notify () {
	/node_modules/.bin/notify --text "${*}" > /dev/null
	log "${*}"
}

pass () {
	log 'PASS'
	exit 0
}

unbindmount () {
	if [ ! "${CIRCLECI}" ] ; then
		sudo umount "${1}"
	fi

	rm -rf "${1}"
}

export -f bindmount
export -f checkfail
export -f download
export -f easyoptions
export -f fail
export -f log
export -f ng
export -f notify
export -f pass
export -f unbindmount


if [ -f ~/.cyph/notify.key ] ; then
	rm ~/.notifyreg 2> /dev/null
	/node_modules/.bin/notify -r "$(cat ~/.cyph/notify.key)" > /dev/null
fi


# Workaround for localhost not working in CircleCI
if [ "${CIRCLECI}" ] ; then
	sed -i 's|localhost|0.0.0.0|g' /cyph/commands/serve.sh /cyph/*/protractor.conf.js
fi
