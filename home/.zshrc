# zsh behaviour
zstyle ':completion:*' auto-description 'specify: %d'
zstyle ':completion:*' completer _expand _complete _ignored _correct _approximate
zstyle ':completion:*' completions 1
zstyle ':completion:*' expand suffix
zstyle ':completion:*' file-sort name
zstyle ':completion:*' glob 1
zstyle ':completion:*' insert-unambiguous true
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' list-prompt %SAt %p: Hit TAB for more, or the character to insert%s
zstyle ':completion:*' matcher-list 'm:{[:lower:]}={[:upper:]}' 'r:|[._-]=** r:|=**'
zstyle ':completion:*' max-errors 1 numeric
zstyle ':completion:*' menu select=1
zstyle ':completion:*' original false
zstyle ':completion:*' prompt '%e errors, possible corrections:'
zstyle ':completion:*' select-prompt %SScrolling active: current selection at %p%s
zstyle ':completion:*' squeeze-slashes true
zstyle ':completion:*' substitute 1
zstyle ':completion:*' verbose true
zstyle :compinstall filename '/home/kcza/.zshrc'
fpath=(~/.config/zsh/zsh-completion $fpath)
autoload -Uz compinit
compinit
zmodload -i zsh/complist
HISTFILE=~/.histfile
HISTSIZE=500
SAVEHIST=15000
setopt HIST_IGNORE_SPACE
bindkey -v

# Path
if [[ -f ~/.cargo/env ]] then
	source ~/.cargo/env
fi
export PATH=$PATH:~/.cargo/bin
export PATH=$PATH:~/.local/bin
export PATH=$PATH:~/go/bin

# Vars
export EDITOR="nvim"
export LESS="IR"

# Aliases
alias addall='git add -p .'
alias l='ls -1'
alias la='ls -Al --color'
alias pull='git pull'
alias push='git push'
alias commit='git commit'
alias ef='nvim "+Telescope find_files"'
alias z='source ~/.zshrc'
alias syu='sudo apt update && sudo apt -y upgrade && sudo snap refresh'
alias status="git status"

# Functions
function mkcd() {
	mkdir "$1" && cd "$1"
}

# Colourful man pages
export LESS_TERMCAP_mb=$'\e[1;32m'
export LESS_TERMCAP_md=$'\e[1;32m'
export LESS_TERMCAP_me=$'\e[0m'
export LESS_TERMCAP_se=$'\e[0m'
export LESS_TERMCAP_so=$'\e[01;33m'
export LESS_TERMCAP_ue=$'\e[0m'
export LESS_TERMCAP_us=$'\e[1;4;31m'

# Theme
source ~/.config/zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source <(starship init zsh)
