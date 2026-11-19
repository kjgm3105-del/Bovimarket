CREATE TABLE `anuncios` (
	`id` text PRIMARY KEY NOT NULL,
	`autor` text NOT NULL,
	`nombre` text NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text NOT NULL,
	`ubicacion` text NOT NULL,
	`mensaje` text NOT NULL,
	`creado` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fotos` (
	`id` text PRIMARY KEY NOT NULL,
	`contenido` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ganado` (
	`id` text PRIMARY KEY NOT NULL,
	`vendedor` text NOT NULL,
	`nombre` text NOT NULL,
	`telefono` text NOT NULL,
	`titulo` text NOT NULL,
	`raza` text NOT NULL,
	`sexo` text NOT NULL,
	`edad` integer NOT NULL,
	`peso` integer NOT NULL,
	`cantidad` integer NOT NULL,
	`tipo` text NOT NULL,
	`precio` integer NOT NULL,
	`ubicacion` text NOT NULL,
	`fecha` text NOT NULL,
	`descripcion` text NOT NULL,
	`imagen` text NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`creado` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `intentos` (
	`id` text PRIMARY KEY NOT NULL,
	`contador` integer NOT NULL,
	`vence` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mensajes` (
	`id` text PRIMARY KEY NOT NULL,
	`receptor` text NOT NULL,
	`emisor` text NOT NULL,
	`correo` text NOT NULL,
	`nombre` text NOT NULL,
	`asunto` text NOT NULL,
	`mensaje` text NOT NULL,
	`creado` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` text PRIMARY KEY NOT NULL,
	`comprador` text NOT NULL,
	`ganado` text NOT NULL,
	`cantidad` integer NOT NULL,
	`total` integer NOT NULL,
	`telefono` text NOT NULL,
	`recogida` text NOT NULL,
	`estado` text NOT NULL,
	`creado` integer NOT NULL,
	FOREIGN KEY (`comprador`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ganado`) REFERENCES `ganado`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pedidos_ganado` ON `pedidos` (`ganado`);--> statement-breakpoint
CREATE INDEX `pedidos_comprador` ON `pedidos` (`comprador`);--> statement-breakpoint
CREATE TABLE `sesiones` (
	`token` text PRIMARY KEY NOT NULL,
	`usuario` text NOT NULL,
	`vence` integer NOT NULL,
	FOREIGN KEY (`usuario`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`correo` text NOT NULL,
	`clave` text NOT NULL,
	`sal` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_correo_unique` ON `usuarios` (`correo`);