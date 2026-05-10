import { Button } from "@ui/components/button";
import { ArrowRightIcon, CalendarCheckIcon, ScissorsIcon, StarIcon, StoreIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import heroFiloImage from "../../../../public/images/hero-filo.png.png";

export function Hero() {
	return (
		<div className="relative max-w-full overflow-x-hidden bg-linear-to-b from-0% from-card to-[50vh] to-background">
			<div className="absolute left-1/2 z-10 ml-[-500px] h-[500px] w-[1000px] rounded-full bg-linear-to-r from-primary to-bg opacity-20 blur-[150px]" />
			<div className="container relative z-20 pt-44 pb-12 text-center lg:pb-16">
				<div className="mb-4 flex justify-center">
					<div className="mx-auto flex flex-wrap items-center justify-center rounded-full border border-highlight/30 p-px px-4 py-1 font-normal text-highlight text-sm">
						<span className="flex items-center gap-2 rounded-full font-semibold text-highlight">
							<span className="size-2 rounded-full bg-highlight" />
							Nuevo:
						</span>
						<span className="ml-1 block font-medium text-foreground">
							Sistema de fidelización con puntos XP
						</span>
					</div>
				</div>

				<h1 className="mx-auto max-w-3xl text-balance font-bold text-5xl lg:text-7xl">
					El gestor de reservas que tu barbería necesita
				</h1>

				<p className="mx-auto mt-4 max-w-lg text-balance text-foreground/60 text-lg">
					Reservas online, fidelización de clientes y gestión completa.
					Sin comisiones. Desde 49,99€/mes.
				</p>

				<div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
					<Button size="lg" variant="primary" asChild>
						<Link href="/auth/signup">
							Empieza gratis
							<ArrowRightIcon className="ml-2 size-4" />
						</Link>
					</Button>
					<Button variant="light" size="lg" asChild>
						<a href="#pricing">Ver precios</a>
					</Button>
				</div>

				<div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-foreground/50 text-sm">
					<span className="flex items-center gap-2">
						<CalendarCheckIcon className="size-4 text-primary" />
						Reservas en 30 segundos
					</span>
					<span className="flex items-center gap-2">
						<StarIcon className="size-4 text-primary" />
						Fidelización con XP
					</span>
					<span className="flex items-center gap-2">
						<ScissorsIcon className="size-4 text-primary" />
						Galería de estilos
					</span>
					<span className="flex items-center gap-2">
						<StoreIcon className="size-4 text-primary" />
						Multi-local
					</span>
				</div>

				<div className="mx-auto mt-16 max-w-5xl rounded-2xl border bg-card/50 p-2 shadow-lg dark:shadow-foreground/10">
					<Image
						src={heroFiloImage}
						alt="Filo - Gestor de reservas para barberías"
						className="rounded-xl"
						priority
					/>
				</div>
			</div>
		</div>
	);
}
