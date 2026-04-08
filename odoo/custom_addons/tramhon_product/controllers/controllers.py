# -*- coding: utf-8 -*-
# from odoo import http


# class TramhonProduct(http.Controller):
#     @http.route('/tramhon_product/tramhon_product', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/tramhon_product/tramhon_product/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('tramhon_product.listing', {
#             'root': '/tramhon_product/tramhon_product',
#             'objects': http.request.env['tramhon_product.tramhon_product'].search([]),
#         })

#     @http.route('/tramhon_product/tramhon_product/objects/<model("tramhon_product.tramhon_product"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('tramhon_product.object', {
#             'object': obj
#         })
