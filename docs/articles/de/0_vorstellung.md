conf:{
    "key": "introduction",
    "title": "Vorstellung"
}:conf

Vorstellung von gamekit
=======================

> Minimalistische, Promise/A basierte HTML5 Canvas Spiele Engine [/buzzwords]

gamekit ist ein minimalistischer Ansatz einer Spielengine, basierend auf HTML5 canvas2D.
Es beinhaltet eine Reihe  Features die ich bei der Spieleentwicklung nützlich fand und nicht jedes mal
auf Neue implementieren wollte.

Und da gamekit auf Promises basiert, ermöglicht es cooles Zeug wie das hier:

    gamekit.fetchAssets('assets.json').then(gameSetup).then(gamekit.start);

Umfasst momentan:

* Promises! jay
* Laden von Resourcen
* Laden von Modulen
* Renderloop
* Layer Unterstützung
* Sprites (rotieren/zerren/wiederholen)
* Eigenschaften animieren bei Sprites (absolut + relativ)
* Einheitengruppen
* Erfassen von Tastatureingaben
* Erfassen von Pointer-Eingaben (Maus, Touch)
* Pointer Bereich Objekte
* Pointer Events direkt auf Sprites erkennen
* Texte

Es war grundlegend gedacht das Konzept von JavaScript Promises bei einer Canvas basierenden Spieleengine
auszuprobieren, allerdings fand ich später heraus, das gamekit wunderbar genutzt werden kann um Teile einer
Webseite oder Web-App zu dynamisieren und animieren, welches ein viel häufigerer Anwendungsfall für mich war,
 als nur Spiele damit zu entwickeln.