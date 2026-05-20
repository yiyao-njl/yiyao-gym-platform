const throttle = (fn,delay = 200) => {//节流函数
	let flag = true;
	return function(...args) {
		if (!flag) return;
		flag = false;
		fn.apply(this, args);
		setTimeout(() => {
			flag = true;
			},delay);
	};
}
module.exports = throttle;
