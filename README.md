# zPDT Portal

A modern, responsive web portal for managing IBM z/OS systems and accessing mainframe resources.

## Overview

The zPDT Portal serves as a centralised landing page for z/OSMF, Zowe, Db2 Query Workload Tuner, and other mainframe tools. It provides quick access to system management interfaces, documentation, and reference materials in a clean, user-friendly interface.

## Features

- **System Management Dashboard**: Quick access to z/OSMF, Zowe, and Db2 QWT
- **Documentation Hub**: Centralised access to playbooks, JCL libraries, IBM docs, and Redbooks
- **Tools Section**: Access to Apache Guacamole and other utilities
- **Service Status Monitoring**: Real-time status indicators for critical services
- **Responsive Design**: Mobile-friendly interface with collapsible navigation
- **Single Page Application**: Smooth scrolling navigation with active section highlighting

## Technologies Used

- **HTML5**: Semantic markup and structure
- **CSS3**: Custom styling with flexbox and grid layouts
- **JavaScript**: Client-side functionality and service monitoring
- **Font Awesome**: Iconography and visual elements
- **IBM Design Language**: Color scheme and styling inspiration

## Deployment

You can simply drop the HTML file onto any web server—no back‑end code or services are required.
When you want to run it as a Liberty‑based application, zip the webpage files, rename the archive to zPDTLandingApp.war, and then transfer the WAR file into the /global/wlpCfg/servers/wlps01a/dropins directory for automatic deployment

## Maintainer

**Benjamin Thompson**
- GitHub: [@benjaminthompson1](https://github.com/benjaminthompson1)
