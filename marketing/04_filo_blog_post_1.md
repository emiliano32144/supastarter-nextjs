# filo — Blog Post #1: Storytelling

**Título:** Cómo perdí 3.000€ al mes por no organizar mis citas (y cómo nació filo)
**Slug:** /blog/como-nacio-filo-organizar-citas-barberia
**Meta title:** Cómo nació filo: de perder citas a gestionar 40 por semana | filo by Codetix
**Meta description:** La historia real de cómo un sistema de reservas desorganizado costaba 3.000€ mensuales, y cómo nació filo para resolverlo.
**Keywords:** software barbería, gestión citas barbería, agenda online peluquería, sistema reservas salón, filo
**Autor:** Equipo filo
**Fecha:** 2025
**Tiempo de lectura:** 6 minutos

---

## Introducción: El problema que no veíamos

Hace dos años, trabajábamos con peluqueros y barberos de Madrid. No como clientes. Como desarrolladores que intentábamos entender por qué un salón con 3 empleados, buena ubicación y clientes fieles... facturaba 30% menos de lo que podría.

El dueño nos mostró su teléfono. 847 mensajes de WhatsApp sin leer. Grupos llamados "Citas Martes", "Cancelaciones Junio", "Peluquero 2 — Julio". La mitad eran memes de otros barberos. La otra mitad, mensajes de clientes preguntando horarios.

"¿Y cuántas de estas citas se concretaron?", preguntamos.

"Ni idea. Si contesto a tiempo, sí. Si estoy cortando y no veo el mensaje... se va a otro lado."

Hicimos la cuenta juntos. 15 mensajes perdidos por semana. Promedio de facturación por cita: 20€. 15 × 20€ × 4 semanas = **1.200€ mensuales perdidos solo por mensajes no vistos**.

Pero eso no era todo.

---

## El iceberg: lo que cuesta una agenda desorganizada

### 1. Las ausencias (no-show)

El cliente confirma por WhatsApp. Llega el día y no aparece. "Se me olvidó", dice después. O simplemente no dice nada.

En el salón que auditamos, el 20% de las citas confirmadas por WhatsApp resultaban en ausencias. Sin recordatorio formal, sin email, sin calendario en el teléfono del cliente... es fácil olvidarse.

**Costo:** 12 ausencias por semana × 20€ = **960€ mensuales**.

### 2. El cliente que no vuelve

"Carlos venía cada 3 semanas. Dejó de venir hace 5 meses. Ni idea por qué."

Sin sistema de seguimiento, los clientes habituales se pierden. No es que vayan a otro salón necesariamente. A veces simplemente... se olvidan de agendar. Y como nadie les recuerda que existen, no vuelven.

**Costo:** 5 clientes perdidos por mes × 3 visitas mensuales × 20€ = **300€ mensuales**.

### 3. El tiempo robado

Cada mensaje de WhatsApp interrumpe. Cortás, mirás el teléfono, respondés, volvés a cortar. Si son 20 mensajes por día, y cada uno te roba 2 minutos de concentración... eso son 40 minutos perdidos diarios. En un mes, **13 horas**.

¿Y si en esas 13 horas cortaras 13 clientes más? **260€ mensuales**.

---

## Total: 2.720€ mensuales que no facturaste

Y eso solo contando lo medible. Si sumamos clientes insatisfechos porque "no le contestaste a tiempo", reseñas negativas de "me dejaron plantado", y el estrés de estar pendiente del teléfono todo el día...

**El número real estaba cerca de 3.000€ mensuales.**

---

## La solución: no era "mejorar WhatsApp"

Intentamos proponer "contestar más rápido". "Usar un grupo de WhatsApp Business". "Poner un bot automático".

Nada funcionó. Porque el problema no era la velocidad de respuesta. El problema era usar una herramienta de mensajería como si fuera un sistema de gestión.

WhatsApp está diseñado para conversar. No para:
- Mostrar disponibilidad en tiempo real
- Evitar doble reserva
- Enviar recordatorios automáticos
- Gestionar cancelaciones sin drama
- Seguir quién es cliente habitual y quién se perdió

Necesitábamos algo diseñado específicamente para salones de belleza.

---

## Así nació filo

### Mes 1: El MVP

Una página simple. El peluquero carga servicios, precios, horarios. El cliente entra, elige, reserva. Email de confirmación automático.

Lo probamos con 3 salones. En la primera semana, uno de ellos recibió 12 reservas sin tocar el teléfono.

"Esto es magia", nos dijo.

"No es magia", le respondimos. "Es que ahora tus clientes reservan cuando quieren, no cuando vos podés contestar."

### Mes 3: Recordatorios + cancelación

Añadimos recordatorio automático 24h antes. Las ausencias bajaron un 40%.

Añadimos cancelación con un click desde el email. Dejó de haber "ghosting" — clientes que simplemente no aparecían sin avisar.

### Mes 6: Fidelización XP

Un peluquero nos dijo: "Mis clientes vuelven, pero no sé por qué. Quiero que vuelvan MÁS seguido."

Diseñamos el sistema de puntos XP. Cada cita suma puntos. Acumulás y subís de nivel. Cada nivel desbloquea una recompensa que el peluquero configura: descuento, servicio gratis, producto de regalo.

"Es como un videojuego", dijo un cliente cuando vio su nivel Bronce con 80% completado para llegar a Plata.

"Exacto", le dijimos. "Y los videojuegos funcionan porque la gente quiere subir de nivel."

### Mes 9: Reprogramación + zonas horarias

Los clientes pedían cambiar de hora. Antes: mensaje de WhatsApp, coordinación manual, 3 mensajes de ida y vuelta.

Con filo: click en "Reprogramar" desde el email, elige nueva fecha y hora, listo. Una vez por reserva. Sin que el peluquero tenga que hacer nada.

También añadimos zonas horarias. Un salón en Tenerife y otro en Madrid usaban filo. Los recordatorios llegaban a la hora correcta en cada isla.

### Mes 12: PWA + bloqueo de días

filo se convirtió en PWA (Progressive Web App). El cliente "instala" filo en su iPhone como si fuera una app nativa. Sin App Store. Sin comisiones.

Añadimos bloqueo de días. Vacaciones, feriados, descansos puntuales. El peluquero bloquea un día en su panel y los clientes automáticamente no ven slots disponibles.

---

## Hoy: filo en números

- **200+** salones usando filo en España
- **15.000+** reservas mensuales gestionadas
- **60%** reducción de ausencias gracias a recordatorios
- **40%** más de retención de clientes con fidelización XP
- **0** WhatsApp necesarios para coordinar una cita

---

## ¿Y vos?

Hacé la cuenta. ¿Cuántas citas perdés por semana? ¿Cuántas ausencias? ¿Cuántos clientes que no vuelven?

Multiplicalo por tu precio promedio.

Eso es lo que cuesta no tener un sistema.

**filo existe para que no tengas que hacer esa cuenta nunca más.**

---

## CTA

**Probá filo 14 días gratis.** Sin tarjeta. Sin compromiso.

Configurás tu salón en 5 minutos. Compartís tu link. Y empezás a recibir citas que se organizan solas.

[👉 Empezar prueba gratis →](https://codetix.es)

---

**Sobre el autor:**  
Equipo filo by Codetix. Armamos herramientas que peluqueros y barberos usan todos los días para facturar más, estresarse menos, y concentrarse en lo que mejor hacen: cortar.

**¿Te gustó este artículo?** Compartilo con un peluquero o barbero que todavía use WhatsApp como agenda. 📲

---

## SEO Tags

**H1:** Cómo perdí 3.000€ al mes por no organizar mis citas (y cómo nació filo)  
**H2:** El iceberg: lo que cuesta una agenda desorganizada  
**H2:** La solución: no era "mejorar WhatsApp"  
**H2:** Así nació filo  
**H3:** Mes 1: El MVP  
**H3:** Mes 3: Recordatorios + cancelación  
**H3:** Mes 6: Fidelización XP  
**H3:** Mes 9: Reprogramación + zonas horarias  
**H3:** Mes 12: PWA + bloqueo de días  
**H2:** Hoy: filo en números  
**H2:** ¿Y vos?

**Alt text imagen hero:** "Peluquero revisando mensajes de WhatsApp mientras corta, mostrando la distracción de usar mensajería como agenda"  
**Alt text imagen 2:** "Interfaz de filo mostrando calendario de reservas con citas organizadas por horario"  
**Alt text imagen 3:** "Cliente viendo sus puntos XP en filo, a 80% de llegar al siguiente nivel"

**Internal links:**
- "sistema de reservas" → /reservas
- "fidelización XP" → /fidelizacion
- "PWA" → /pwa
- "prueba gratis" → /signup

**External links:**
- "Fresha" → https://fresha.com (nofollow)
- "Reservio" → https://reservio.com (nofollow)
