# Hardware & Deployment Requirements

## Architecture Overview
TheEnvoysOS is designed to run on a local network, utilizing a "Central Control" server (usually a laptop or mini-PC) and multiple displays for output.

```ascii
[ Operator Laptop ] <---- Network ----> [ EnvoysOS Server ] 
      (Dashboard)                            |
                                             +--- HDMI 1 ---> [ Audience Projector ]
                                             +--- HDMI 2 ---> [ Stage Display ]
                                             +--- Network --> [ OBS / Livestream PC ]
```

## Recommended Hardware Tiers

### 1. Small Church / Portable Setup
*Ideal for setups where the operator laptop is also the display server.*

*   **Computer**: MacBook Air M1/M2 or Windows Laptop (Ryzen 5 / i5, 16GB RAM)
*   **Displays**:
    *   1x External HDMI (Audience)
    *   1x Laptop Screen (Dashboard)
*   **Network**: Standard Wi-Fi Router (5GHz recommended)
*   **Stream**: N/A or simple phone streaming.

### 2. Medium Church (Standard Production)
*Dedicated server for stability.*

*   **Server**: Mac Mini M2 or Intel NUC (i5/i7, 16GB RAM)
    *   *Role*: Runs EnvoysOS Server, connected to displays.
*   **Displays**:
    *   USB-C to Dual HDMI Adapter (DisplayLink or MST)
    *   Output 1: Main Projector (1080p)
    *   Output 2: Confidence Monitor (720p/1080p)
*   **Operator Control**: Any tablet (iPad) or laptop on the same network.
*   **Stream**: Separate PC running OBS, ingesting "Stream View" via Browser Source over LAN.

### 3. Mega Church / Broadcast
*High redundancy and professional integration.*

*   **Server**: Mac Studio or High-End Windows Workstation (RTX 3060+, 32GB RAM)
    *   *Why GPU?* Smooth animations on 3+ high-res displays.
*   **Displays**:
    *   Output 1: LED Wall Processor (Audience)
    *   Output 2: Stage TV/Projector (Stage)
    *   Output 3: Multiview/Spare
*   **Stream**: Dedicated Streaming PC (vMix/OBS) utilizing Alpha Transparency feed.
*   **Network**: Wired Gigabit Ethernet (Cat6) for Server and Stream PC. Unifi/Cisco managed switch.

## Network Topology Requirements
*   **Protocol**: WebSockets (ensure firewall allows TCP port 3000/10000).
*   **Latency**: <10ms ping recommended between Operator and Server.
*   **Static IP**: Assign a static IP to the EnvoysOS server for reliable OBS Browser Source connection.

## Tested Production Hardware
*   **Apple**: Mac Mini (M1), MacBook Pro 14" (M1 Pro)
*   **Windows**: Dell XPS 15, HP EliteDesk 800 Mini
*   **Adapters**: Anker USB-C to Dual HDMI, StarTech DisplayLink Dock
