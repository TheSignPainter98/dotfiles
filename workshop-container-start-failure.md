# Preface

Contributor-facing troubleshooting for Workshop container start failures (`lxd forkstart` exit status 1), including host-level causes and workarounds that fall outside Workshop's own configuration.

## Scope

This document covers environment-specific issues that prevent Workshop's LXD backend from launching containers, but that are **not** caused by Workshop or this project's configuration. These problems live on the host operating system and require host-level remediation.

## Container Start Fails (LXD forkstart Exit Status 1)

- Symptom: `Failed running: /snap/lxd/current/sbin/lxd forkstart ... exit status 1` in `workshop changes` / `workshop tasks` output, with no further detail
- The real error is hidden behind the generic `exit status 1`; check `sudo tail /var/snap/lxd/common/lxd/logs/lxd.log` for LXD daemon warnings

### Mullvad VPN causes a hybrid cgroup state

- Common cause: **Mullvad VPN** (or any app using cgroup v1 `net_cls`) mounts `net_cls` at `/sys/fs/cgroup/net_cls`, putting the system into a hybrid cgroup state that LXD refuses to operate in. LXD logs `Unsupported CGroup setup detected, V1 controllers on top of V2 root`
- Diagnostic: `mount | grep net_cls` shows a cgroup v1 mount nested under `/sys/fs/cgroup/`
- Confirm LXD itself (not Workshop) is broken: `lxc init ubuntu:24.04 test && lxc start test` fails identically
- Fix (permanent, survives reboots): tell `mullvad-daemon` to mount `net_cls` elsewhere via a systemd drop-in. **This makes permanent, system-level changes to the host — review each command before running it manually:**
  ```bash
  sudo mkdir -p /opt/net-cls-v1
  sudo mkdir -p /etc/systemd/system/mullvad-daemon.service.d
  sudo tee /etc/systemd/system/mullvad-daemon.service.d/override.conf > /dev/null <<'EOF'
  [Service]
  Environment="TALPID_NET_CLS_MOUNT_DIR=/opt/net-cls-v1/"
  EOF
  sudo systemctl daemon-reload
  sudo systemctl stop mullvad-daemon
  sudo umount /sys/fs/cgroup/net_cls   # remove stale mount so mullvad picks up new location
  sudo systemctl start mullvad-daemon
  ```
- Verify: `mount | grep net_cls` should show `net_cls on /opt/net-cls-v1`, and LXD's cgroup warning should be gone from the daemon log
- See https://github.com/mullvad/mullvadvpn-app/issues/3651 and https://discuss.linuxcontainers.org/t/help-help-help-cgroup2-related-issue-on-ubuntu-jammy-with-mullvad-and-privateinternetaccess-vpn/14705/18

## Notes

- These workarounds target the host, not the Workshop sandbox or this project. They may need to be adapted for other VPN clients or cgroup-using applications that mount v1 controllers alongside a v2 root cgroup.
- When in doubt, reproduce the failure with a bare `lxc` command as shown above to confirm the issue is host-level before applying any fix.
