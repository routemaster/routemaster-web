Routemaster (Frontend)
======================

![Logo](https://www.cise.ufl.edu/~woodruff/routemaster/logo_small.png)

Walking is boring. Let's turn it into an online multiplayer competitive game!

- Map your walking, running, biking, or even driving paths with GPS on your
  phone.
- View past routes, and the routes of your friends
- Earn points for walking efficient routes
- Earn points for exploring more area than your friends

Repository Organization
-----------------------

This is the repository for our front-end. It will contain a minimal development
webserver in Java, and the HTML, CSS, and Javascript needed for our UI.
Eventually it should contain the build scripts for our Phonegap builds.

Building the Project
--------------------

1. Install Maven
    - Install it on Debian with `aptitude install maven`
    - Install it on Arch with `pacman -S maven`
    - The Maven wiki has
      [installation instructions for Windows](https://maven.apache.org/guides/getting-started/windows-prerequisites.html)
2. Package the application with `mvn package`
    - You can alternatively run `mvn compile`, which builds only the class files
      and copies over the resources into `bin`
3. Run the jar with `java -jar dist/routemaster-frontend-0.0.1-SNAPSHOT.jar`.

Project Scope
-------------

This project is being created by a team of eight students at the University of
Florida for CEN3031, Introduction to Software Engineering. It will be developed
in three Scrum sprints over the course of the Spring 2013 semester.

License
-------

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program. If not, see <http://www.gnu.org/licenses/>.
