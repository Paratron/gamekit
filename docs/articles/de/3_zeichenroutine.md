conf:{
    "key": "renderloop",
    "title": "Die Zeichenroutine"
}:conf

Die Zeichenroutine
===============

Gamekit nutzt seine eigene Zeichenroutine, welche wenn möglich auf [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame) zurückgreift, wenn möglich.
Wenn der verwendete Browser RAF nicht unterstützt, wird ein [Fallback](https://gist.github.com/paulirish/1579671) verwendet, welcher durch Verwendung eines JavaScript Timers versucht bei ~60FPS zu rendern.

Gamekit verwendet Instanzen von `gamekit.Core` um in mehrere Canvas Elemente zu rendern.
Wenn du nur ein Canvas Element nutzt, musst du dir keine Umstände machen. Beim Laden der Seite
erfasst gamekit automatisch das erste Canvas Element auf der Seite und verbindet sich selbst damit.
Dies macht es dir leichter dein Spiel einzurichten.

Gamekit erfordert ebenfalls nicht, das du dir Zugriff auf die Instanz des `gamekit.Core` Objekts
verschaffen und damit herumjonglieren musst, um Zugriff auf die Canvas zu erhalten. Die Standardinstanz
wird direkt auf den Haupt-Namespace `gamekit` übertragen. Wenn du in weitere Canvas in deinem Dokument
rendern möchtest, erstelle bitte weitere `gamekit.Core` instanzen manuell.

Für Einsteiger ist die einzig wichtige Methode des Kerns `gamekit.start()`, welches die Engine anweist
die Zeichenroutine zu starten und deine Inhalte zu rendern.


Innerhalb der Zeichenroutine
----------------------------
In jedem zu zeichnenden Frame, leert die Zeichenroutine zuerst die Canvas (wenn dies durch einmaligen
Aufruf von `gamekit.clearCanvas()` aktiviert wurde), danach ruft es den `onBeforeFrame()` Hook auf (siehe unten).

Danach geht gamekit über alle aktiven Tweens (Werteveränderungen) und aktualisiert sie.

Wenn alle Tweens aktualisiert wurden läuft die Zeichenroutine über die vorhandenen [Ebenen](ebenen-gruppen-und-sprites#ebenen).
In jeder Ebene werden alle zeichenbare Objekte durchgegangen und zuerst aktualisiert (durch Aufruf ihrer `Sprite.update()` Methode),
dann gezeichnet (durch Aufruf von `Sprite.render()`).

Nachdem alles gezeichnet wurde ruft gamekit den `onAfterFrame()` Hook auf, falls angewandt.


Das Zeichnen manipulieren
-------------------------
Es ist möglich eigene Routinen zu einzufügen, welche vor und nach dem Zeichnen jedes Frames aufgerufen werden.
Du kannst diese Methoden wie folgt definieren:

    gamekit.setOnBeforeFrame(function(ctx){
        //...
    });

    gamekit.setOnAfterFrame(function(ctx){
        //...
    });

Die `gamekit.setOnBeforeFrame()` und `gamekit.setOnAfterFrame()` Methoden erwarten eine Funktion als ersten
Parameter. Die übergebene Funktion wird bei jeden Frame aufgerufen, welcher von der Zeichenroutine gezeichnet wird.

Um Zugriff auf die Canvas zu erhalten, wird das context2D objekt als erster Parameter in die Funktion übergeben.
