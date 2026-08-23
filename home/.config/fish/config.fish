set fish_greeting

fish_add_path ~/go/bin
fish_add_path ~/.local/bin
fish_add_path ~/.cargo/bin
fish_add_path ~/.npm-global/bin
fish_add_path /usr/lib/ccache
fish_add_path /snap/rustup/current/bin

export OPENSPEC_TELEMETRY=0

if status is-interactive
	set -g fish_key_bindings fish_vi_key_bindings
	fish_vi_key_bindings insert

	function f --description 'Reload config'
		source ~/.config/fish/config.fish
	end

	function jd --wraps 'jj diff' --description 'Compare file contents between two revisions'
		jj diff $argv
	end

	function jde --wraps 'jj diffedit' --description 'Touch up the content changes in a revision with a diff editor'
		jj diffedit $argv
	end

	function jD --wraps 'jj describe' --description 'Update the change descriptoin or other metadata'
		jj describe $argv
	end

	function jc --wraps 'jj commit' --description 'Update the description and crate a new change on top'
		jj commit $argv
	end

	function jl --wraps 'jj log' --description 'Show revision historyy'
		jj log $argv
	end

	function in_jj_repo --description 'Check whether the current working directory is within a jj repo'
		set -l dir (pwd)
		while test $dir != '/'
			if test -d $dir/.jj
				echo "this is a jj repo"
				return 0
			end
			set dir (path dirname $dir)
		end
		return 1
	end

	function gd --wraps 'git diff' --description 'Show changes between commits, commit and working tree, etc'
		if in_jj_repo
			return
		end
		git diff $argv
	end

	function gD --wraps 'git diff --cached' --description 'Show changes between commits, commit and working tree, etc'
		if in_jj_repo
			return
		end
		git diff --cached $argv
	end

	function gs --wraps 'git status' --description 'Show the working tree status'
		if in_jj_repo
			return
		end
		git status $argv
	end

	function ga --wraps 'git add -p' --description 'Add file contents to the index by patch'
		if in_jj_repo
			return
		end
		git add -p $argv
	end

	function gA --wraps 'git add' --description 'Add file contents to the index'
		if in_jj_repo
			return
		end
		git add $argv
	end

	function gc --wraps 'git commit' --description 'Record changes to the repository'
		if in_jj_repo
			return
		end
		git commit $argv
	end

	function gC --wraps 'git commit --amend' --description 'Record changes to the repository, amend'
		if in_jj_repo
			return
		end
		git commit --amend $argv
	end

	function gb --wraps 'git branch' --description 'List, create or delete branches'
		if in_jj_repo
			return
		end
		git branch $argv
	end

	function gk --wraps 'git checkout' --description 'Switch branches or restore working tree files'
		if in_jj_repo
			return
		end
		git checkout $argv
	end

	function gr --wraps 'git rebase' --description 'Reapply commits on top of another base tip'
		if in_jj_repo
			return
		end
		git rebase $argv
	end

	function gR --wraps 'git reset' --description 'Reset current HEAD to the specified state'
		if in_jj_repo
			return
		end
		git reset $argv
	end

	function gl --wraps 'git log' --description 'Show commit logs'
		if in_jj_repo
			return
		end
		git log $argv
	end

	function gp --wraps 'git pull' --description 'Fetch from and integrate with another repository or a local branch'
		if in_jj_repo
			return
		end
		git pull $argv
	end

	function gP --wraps 'git push' --description 'Fetch from and integrate with another repository or a local branch'
		if in_jj_repo
			return
		end
		git push $argv
	end

	function ef --wraps 'nvim' --description 'Open nvim and start fuzzy search'
		nvim '+Telescope find_files'
	end

	function mkcd --wraps 'mkdir' --description 'Make directory and cd into it'
		argparse -N 1 -X 1 -- $argv
			or return
		set -l dir $argv[1]

		mkdir -p $dir \
			&& cd $dir
	end

	function syu --description 'Upgrade all packages'
		sudo apt update \
		&& sudo apt -y upgrade \
		&& sudo snap refresh
	end

    function ls --wraps 'eza' --description 'List directory contents'
        eza $argv
    end

    function m33 --wraps 'ssh' --description 'Log into M.33'
        ssh kcza@m33.lan $argv
    end

    function m33.forward --description 'Set up port-forwarding for M.33'
        set dashboard_port 11000
        set remote_model_port 11434
        set local_model_port 11001
        ssh -f -N -L $dashboard_port:localhost:$dashboard_port kcza@m33.lan
        ssh -f -N -L $local_model_port:localhost:$remote_model_port kcza@m33.lan
    end

    function m33.mps --description "List M.33's running models"
        set ps (ssh kcza@m33.lan ollama ps | tee /dev/stderr)
        if echo $ps | grep 'CPU' >/dev/null
            echo '+-----------------------------------------+'
            echo '| WARNING: a model is running on the CPU! |'
            echo '+-----------------------------------------+'
        end
    end

    function m33.models --description "List M.33's known models"
        ssh kcza@m33.lan ollama list
    end

    function m33.restart-ollama --description 'Reload the ollama snap on M.33'
        ssh kcza@m33.lan sudo snap restart ollama
    end

    function m33.poweroff --description 'Shut down M.33 immediately'
        ssh kcza@m33.lan sudo systemctl poweroff
    end

    function m33.reboot --description 'Reboot M.33 immediately'
        ssh kcza@m33.lan sudo systemctl reboot
    end

    function m33.llama-server --description 'Run llama-server on M.33'
        ssh kcza@m33.lan llama-server $argv
    end

    function m33.laguna-server --description 'Run llama-server-laguna on M.33'
        ssh kcza@m33.lan llama-server-laguna $argv
    end

    function pi --wraps 'workshop run pi' --description 'Start pi coding agent'
        workshop run pi $argv
    end

    function omp --wraps 'workshop run omp' --description 'Start omp coding agent'
        workshop run omp $argv
    end

	export EDITOR=nvim
	export LESS=IR
	export LESS_TERMCAP_mb="$(printf "\e[1;31m")"
	export LESS_TERMCAP_md="$(printf "\e[1;31m")"
	export LESS_TERMCAP_me="$(printf "\e[0m")"
	export LESS_TERMCAP_se="$(printf "\e[0m")"
	export LESS_TERMCAP_so="$(printf "\e[1;44;33m")"
	export LESS_TERMCAP_ue="$(printf "\e[0m")"
	export LESS_TERMCAP_us="$(printf "\e[1;32m")"

    # Commands to run in interactive sessions can go here
	starship init fish | source
end
