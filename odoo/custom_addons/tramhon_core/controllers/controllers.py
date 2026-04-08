# -*- coding: utf-8 -*-
# from odoo import http


# class TramhonCore(http.Controller):
#     @http.route('/tramhon_core/tramhon_core', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/tramhon_core/tramhon_core/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('tramhon_core.listing', {
#             'root': '/tramhon_core/tramhon_core',
#             'objects': http.request.env['tramhon_core.tramhon_core'].search([]),
#         })

#     @http.route('/tramhon_core/tramhon_core/objects/<model("tramhon_core.tramhon_core"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('tramhon_core.object', {
#             'object': obj
#         })
