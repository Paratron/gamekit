conf:{
    "key": "modules",
    "title": "Module"
}:conf

Module
======

Jeder der schon einmal halbwegs ernsthaft JavaScript programmiert hat weiss, das man seine
Programmlogik in mehrere Dateien aufteilen muss um eine saubere Codebasis zu bewahren.

Obwohl ich weiß das mehrere JavaScript Module-Loader existieren und ich persönlich am liebsten
mit requireJS arbeite; habe ich mich dennoch dazu entschlossen meinen eigenen, schlanken Module-Loader
in gamekit zu integrieren, da ich die benötigte Menge Code bei meiner Engine so klein wie möglich
halten wollte.

Wie auch immer - wenn du auf einem anderen Module-Loader aufbauen möchtest, kannst du natürlich
alles verwenden was du möchtest.


Über gamekit Module
-------------------
Gamekit Module sind dazu gedacht um Logik und Informationen soweit wie möglich aufzuteilen.
Es ist notwendig, dass du deine Anwendung (oder dein Spiel) in mehrere JavaScript Dateien aufteilst,
um eine saubere Codestruktur zu bewahren und dich nicht in deinem eigenen Code zu verlieren.

Meine Faustregel ist: wann auch immer etwas in einem anderen Teil der Anwendung wiederverwendbar
ist, nicht notwendigerweise gleich zu Beginn zur Verfügung stehen muss, oder komplex genug ist
um für sich selbst zu stehen, dann separiere ich es in ein eigenes Modul.

Gamekit Module sollten _eine_ Moduldefinition pro Datei haben. Der Dateiname hängt direkt mit dem
Modulnamen zusammen. Das Modul `main` zum Beispiel, muss in der Datei `main.js` gespeichert werden.

Gamekit setzt voraus, das alle Module innerhalb eines Ordners gespeichert sind. Dieser ist standardmäßig
`lib/game/` und kann jederzeit über die Eigenschaft `gamekit.moduleFolder` geändert werden.

Alle geladenen Module werden innerhab von gamekits Modul-Namespace `gamekit.m` gespeichert. Im Falle des
main Moduls, kannst du dieses jederzeit über `gamekit.m.main` erreichen, nachdem es geladen wurde.


Die Anatomie eines gamekit Moduls
---------------------------------
Du kannst ein gamekit Modul definieren, indem du die Methode `gamekit.defineModule` aufrufst. Du
übergibst einen Modulnamen und den Modulinhalt an die Methode. Zum Beispiel:

    gamekit.defineModule('hauptMenu', function(){
        //...
    });

Der obrige Code muss in der Datei `lib/game/hauptMenu.js` gespeichert werden. Wenn das Modul geladen
wird, prüft gamekit ob der Modulinhalt eine Funktion ist. Ist dies der Fall, wird die Funktion ausgeführt
und was auch immer sie zurück gibt wird in den Modul-Namespace geschrieben. Dies ist sehr nützlich wenn
du komplexe Module erstellen willst, die allerdings nur eine feste API zur Interaktion zur Verfügung stellen
sollen. In diesem Fall gibst du nur ein Objekt aus der Modulinhalt Funktion zurück, welches Methoden zur
Interaktion mit dem Modul selbst enthält.

Wenn dein Modulinhalt keine ausführbare Funktion ist, wird er direkt in den Modul-Namespace geschrieben.
Du könntest zum Beispiel deine Itemdefinitionen in einem gamekit Modul speichern:

    gamekit.defineModule('items', {
        "schwert": ...
    });



Module laden und auf Abschluss warten
-------------------------------------
Da gamekit komplett auf Promises basiert, ist auch das Laden von Modulen keine Ausnahme.
Um ein (oder viele) Modul(e) zu laden, rufe einfach `gamekit.fetchModules()` auf. Diese Methode
gibt ein Promise zurück, welches erfüllt wird, nachdem alle Module geladen wurden.

Ein kurzes Beispiel:

    gamekit
        .fetchModules(['menuButton', 'mainMenu'])
        .then(function(){
            //Mit einer ausgegebenen API des mainMenu Moduls interagieren.
            gamekit.m.mainMenu.show();
        });

Der obrige Code lässt gamekit zwei Module laden: `menuButton` und `mainMenu`. Nachdem beide
erfolgreich geladen wurden wird der Callback ausgeführt, welcher das Hauptmenü öffnet (angenommen
dass das Modul ein Objekt mit einer `show` Methode zurückgegeben hat).


Module aufeinander basieren lassen (require)
--------------------------------------------

`gamekit.fetchModules` mehrmals aufzurufen bewirkt nicht, das gamekit die Module jedes mal neu lädt.
Wenn gamekit ein Modul bereits im Modul-Namespace vorfindet, lädt es das Modul nicht noch einmal.
Mit diesem Wissen ist es leicht sicherzustellen, dass andere Module geladen wurden, damit das neue
Modul ordnungsgemäß funktioniert.

Hier ein Beispiel:

    gamekit.defineModule('pauseMenu', function(){
        gamekit.fetchModules('menuButton')
            .then(function(){
                //Moduldefinition hier
            });
    });
