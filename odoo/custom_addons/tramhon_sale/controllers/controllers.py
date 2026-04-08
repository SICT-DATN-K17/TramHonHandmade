# -*- coding: utf-8 -*-
# from odoo import http


# class TramhonSale(http.Controller):
#     @http.route('/tramhon_sale/tramhon_sale', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/tramhon_sale/tramhon_sale/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('tramhon_sale.listing', {
#             'root': '/tramhon_sale/tramhon_sale',
#             'objects': http.request.env['tramhon_sale.tramhon_sale'].search([]),
#         })

#     @http.route('/tramhon_sale/tramhon_sale/objects/<model("tramhon_sale.tramhon_sale"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('tramhon_sale.object', {
#             'object': obj
#         })
