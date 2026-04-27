import { useEffect, useState } from 'react'
import { useAssetReadyStore } from '../store/useAssetReadyStore'

/**
 * Premium loading screen for the desert view.
 * Features an SVG line-drawing animation of the brand logo (cactus icon)
 * traced from the actual logo-1.svg paths in copper tones.
 */
export default function DesertLoading() {
  const ready = useAssetReadyStore((s) => s.sceneAssetsReady)
  const [shouldRender, setShouldRender] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (ready) {
      setIsFading(true)
      const timer = setTimeout(() => setShouldRender(false), 1400)
      return () => clearTimeout(timer)
    }
  }, [ready])

  if (!shouldRender) return null

  return (
    <div className={`desert-loading ${isFading ? 'is-fading' : ''}`}>
      <div className="desert-loading__content">
        <div className="desert-loading__logo">
          <svg
            viewBox="0 0 746 760"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="loading-logo-svg"
          >
            {/*
              Traced from logo-1.svg filled paths.
              Stem: runs from bottom (~455,740) up through the center to the top curl (~348,51)
              covering the light copper inner stem + dark copper outer stem.
            */}
            <path
              className="logo-path logo-path--stem"
              d="M455 740
                 C455 700 455 665 455 620
                 C455 580 450 540 450 500
                 C450 460 451 420 451 380
                 C451 360 449 358 436 374
                 C433 378 432 388 432 398
                 C432 408 431 418 431 428
                 C431 438 430 448 431 456
                 C432 460 435 458 436 457
                 C440 450 440 440 440 430
                 C440 400 439 370 436 374"
              stroke="#B8723A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner stem — light copper, the thinner central spine */}
            <path
              className="logo-path logo-path--inner"
              d="M465 740
                 C466 700 469 665 469 620
                 C469 580 470 540 470 500
                 C470 460 472 420 472 380
                 C472 350 468 248 465 172
                 C464 157 459 140 459 110
                 C458 100 454 85 449 87
                 C449 92 454 102 457 112
                 C460 130 462 158 463 180
                 C464 210 464 234 468 248"
              stroke="#C57A4A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Top curl — the topmost ornamental curve of the stem */}
            <path
              className="logo-path logo-path--top"
              d="M330 215
                 C330 200 331 180 333 170
                 C335 155 336 140 337 125
                 C338 115 340 100 342 87
                 C343 80 344 67 346 64
                 C348 58 350 54 351 55
                 C350 58 348 62 346 68
                 C343 80 342 95 343 106
                 C343 115 342 125 340 135
                 C338 150 336 165 333 175
                 C330 195 329 210 323 215
                 C321 250 321 280 321 310
                 C321 340 321 356 325 365
                 C326 368 322 372 316 368"
              stroke="#DDA97A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right branch — dark copper sweep from stem up-right toward the top right */}
            <path
              className="logo-path logo-path--right"
              d="M468 248
                 C470 237 472 235 474 248
                 C479 242 485 228 489 223
                 C492 220 498 214 510 201
                 C524 191 538 180 553 165
                 C560 162 566 168 554 173
                 C545 177 538 180 525 193
                 C510 206 498 218 487 228"
              stroke="#894D30"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Far-right reach — continues the right branch to the upper-right flowers */}
            <path
              className="logo-path logo-path--farright"
              d="M553 165
                 C570 160 585 157 605 157
                 C615 161 624 161 624 161
                 C619 165 612 167 605 165
                 C590 163 585 164 580 166
                 C575 168 566 170 560 172"
              stroke="#7B3C1D"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Upper-right petal — the top ornamental loop */}
            <path
              className="logo-path logo-path--petal-r"
              d="M624 161
                 C637 167 650 177 653 187
                 C657 197 656 207 649 216
                 C645 224 642 223 641 228
                 C642 224 645 220 649 216
                 C656 207 655 195 652 187
                 C648 177 641 172 641 171"
              stroke="#894D30"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Left branch — light copper sweep from stem down-left */}
            <path
              className="logo-path logo-path--left"
              d="M321 356
                 C316 353 309 343 298 332
                 C287 313 277 303 268 296
                 C258 288 252 278 252 288
                 C260 283 268 296 280 305
                 C293 322 305 343 316 354"
              stroke="#D19D6E"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Far-left reach — continues down-left to the loop */}
            <path
              className="logo-path logo-path--farleft"
              d="M252 288
                 C238 278 230 265 218 260
                 C210 259 203 261 194 269
                 C187 275 182 280 182 288
                 C178 293 179 304 182 313
                 C183 323 184 340 180 357
                 C183 357 185 363 185 370"
              stroke="#C3824F"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Lower-left extension */}
            <path
              className="logo-path logo-path--lower-left"
              d="M185 370
                 C188 374 190 378 190 397
                 C191 410 192 410 188 405
                 C188 398 186 394 183 385
                 C180 367 179 358 180 357"
              stroke="#E5AA73"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bottom-left sweep — the lowest descending curves */}
            <path
              className="logo-path logo-path--bottom-left"
              d="M193 417
                 C197 420 200 427 205 430
                 C206 432 207 428 203 407
                 C200 399 196 390 193 382
                 C192 379 188 378 187 379"
              stroke="#E08F48"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner left detail curves */}
            <path
              className="logo-path logo-path--detail-left"
              d="M225 479
                 C222 477 221 478 221 482
                 C225 490 232 505 246 529
                 C254 542 256 544 264 536
                 C267 534 268 531 266 528
                 C260 521 258 521 245 524
                 C240 522 236 513 235 498
                 C233 491 229 485 225 479"
              stroke="#D19D6E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right side lower stem */}
            <path
              className="logo-path logo-path--stem-lower-r"
              d="M472 392
                 C472 420 471 450 471 480
                 C471 510 471 540 470 568
                 C469 592 469 620 469 665
                 C469 698 468 712 466 738
                 C465 744 463 744 460 730
                 C460 720 461 714 462 712
                 C465 700 465 660 465 620
                 C465 580 465 540 465 500
                 C466 481 465 460 465 440"
              stroke="#83472D"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bottom curves — lower connecting strokes */}
            <path
              className="logo-path logo-path--bottom"
              d="M319 617
                 C315 591 300 576 286 562
                 C276 545 270 545 266 536
                 C256 544 256 544 270 565
                 C284 582 295 595 319 617
                 C324 610 323 601 322 598"
              stroke="#F0B87F"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Lower-right branch detail */}
            <path
              className="logo-path logo-path--lower-right"
              d="M512 326
                 C502 333 485 344 477 348
                 C474 350 473 352 473 356
                 C484 338 494 334 505 326
                 C510 322 512 326 512 326"
              stroke="#83472D"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right-side far sweep */}
            <path
              className="logo-path logo-path--far-sweep"
              d="M512 326
                 C525 317 542 305 557 288
                 C575 276 583 277 593 270
                 C606 261 617 247 631 237
                 C629 240 617 251 601 260
                 C593 265 583 272 575 280
                 C562 292 552 300 554 299"
              stroke="#864625"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Bottom stems connecting */}
            <path
              className="logo-path logo-path--connect"
              d="M341 619
                 C346 620 350 623 358 631
                 C360 642 363 648 375 660
                 C380 654 390 653 396 656
                 C397 659 397 663 397 677
                 C398 691 394 711 394 723
                 C392 726 393 726 393 743"
              stroke="#BF895C"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Lower left attachment */}
            <path
              className="logo-path logo-path--attach"
              d="M340 633
                 C334 631 325 622 323 610
                 C329 611 329 613 337 620
                 C341 625 342 637 342 637"
              stroke="#E0B181"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Right-bottom sub-stem */}
            <path
              className="logo-path logo-path--sub-r"
              d="M409 646
                 C414 647 418 639 419 630
                 C425 629 424 624 425 621
                 C432 588 433 571 435 554
                 C436 544 440 543 440 531
                 C440 517 436 503 435 488
                 C435 479 434 471 435 458"
              stroke="#83472D"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Far-bottom stems */}
            <path
              className="logo-path logo-path--far-bottom"
              d="M449 672
                 C449 660 449 607 449 601
                 C450 592 450 580 450 547
                 C450 508 451 468 451 435
                 C454 434 455 438 455 465
                 C455 537 455 600 455 664
                 C455 670 455 674 453 675
                 C451 676 449 673 449 672"
              stroke="#995C3C"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Final bottom pieces */}
            <path
              className="logo-path logo-path--final"
              d="M449 719
                 C449 726 452 731 454 743
                 C448 745 449 738 449 738
                 C449 731 449 726 449 719"
              stroke="#AF7249"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="desert-loading__text">Entering the Desert</div>
        <div className="desert-loading__bar-container">
          <div className={`desert-loading__bar ${ready ? 'is-full' : ''}`} />
        </div>
      </div>
    </div>
  )
}
