# No(de) Shell

Both **no shell** or **node shell** accurately describe `nsh`.

The goal of `nsh` is to provide a basic shell that will run without having `bash` or another process tidy things up first.

The shell needs to be able to nest without mixing up who gets what keyboard input.
The shell should also be able to run interactive programs like *vim*.

Right now node doesn't support doing proper job control, although I have a pull-request into libuv about that.

- https://github.com/joyent/libuv/pull/934

Features are welcome, but may not be added until I'm sure the basics are stable.
