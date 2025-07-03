const express = require('express');
const BooksController = require('../controllers/booksController');

const router = express.Router();
const booksController = new BooksController();

router.post('/books', booksController.createBook.bind(booksController));
router.get('/books', booksController.getBooks.bind(booksController));
router.get('/boos/:id', booksController.getBookById.bind(booksController));
router.put('/books/:id', booksController.updateBook.bind(booksController));
router.delete('/books/:id', booksController.deleteBook.bind(booksController));

module.exports = router;
