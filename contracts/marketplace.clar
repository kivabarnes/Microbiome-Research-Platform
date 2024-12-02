;; Microbiome Marketplace Contract

(define-map products
  { product-id: uint }
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    price: uint,
    seller: principal,
    available: bool
  }
)

(define-data-var last-product-id uint u0)

(define-constant err-not-found (err u404))
(define-constant err-unauthorized (err u401))
(define-constant err-insufficient-funds (err u402))

(define-public (list-product (name (string-utf8 100)) (description (string-utf8 500)) (price uint))
  (let
    ((new-id (+ (var-get last-product-id) u1)))
    (map-set products
      { product-id: new-id }
      {
        name: name,
        description: description,
        price: price,
        seller: tx-sender,
        available: true
      }
    )
    (var-set last-product-id new-id)
    (ok new-id)
  )
)

(define-public (update-product (product-id uint) (new-price uint) (new-available bool))
  (let
    ((product (unwrap! (map-get? products { product-id: product-id }) err-not-found)))
    (asserts! (is-eq (get seller product) tx-sender) err-unauthorized)
    (map-set products
      { product-id: product-id }
      (merge product { price: new-price, available: new-available })
    )
    (ok true)
  )
)

(define-public (buy-product (product-id uint))
  (let
    ((product (unwrap! (map-get? products { product-id: product-id }) err-not-found)))
    (asserts! (get available product) err-not-found)
    (try! (stx-transfer? (get price product) tx-sender (get seller product)))
    (map-set products
      { product-id: product-id }
      (merge product { available: false })
    )
    (ok true)
  )
)

(define-read-only (get-product (product-id uint))
  (map-get? products { product-id: product-id })
)
