from flask import Flask, render_template, request, redirect, url_for, flash, send_file, abort, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from models import db, User, File, bcrypt
from config import Config
import os
import logging

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), app.config['UPLOAD_FOLDER'])

# Set up logging
logging.basicConfig(level=logging.INFO)

# Initialize extensions
db.init_app(app)
bcrypt.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Route handlers
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash('Username already exists')
            return redirect(url_for('signup'))

        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful')
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    user_files = File.query.filter_by(user_id=current_user.id, parent_folder_id=None).all()
    return render_template('dashboard.html', files=user_files)

@app.route('/download_file/<int:file_id>')
@login_required
def download_file(file_id):
    try:
        file = File.query.get_or_404(file_id)
        
        if file.user_id != current_user.id:
            abort(403, description="You don't have permission to access this file")
            
        if not os.path.exists(file.filepath):
            abort(404, description="File not found in storage")
            
        if file.is_folder:
            abort(400, description="Cannot download a folder")
            
        return send_file(
            file.filepath,
            as_attachment=True,
            download_name=secure_filename(file.filename)
        )
        
    except Exception as e:
        app.logger.error(f"Error downloading file: {str(e)}")
        abort(500, description="Error occurred while downloading file")

@app.route('/view_file/<int:file_id>')
@login_required
def view_file(file_id):
    try:
        file = File.query.get_or_404(file_id)
        
        if file.user_id != current_user.id:
            abort(403, description="You don't have permission to access this file")
            
        if not os.path.exists(file.filepath):
            abort(404, description="File not found in storage")
            
        if file.is_folder:
            abort(400, description="Cannot view a folder")
            
        return send_file(
            file.filepath,
            as_attachment=False
        )
        
    except Exception as e:
        app.logger.error(f"Error viewing file: {str(e)}")
        abort(500, description="Error occurred while viewing file")

@app.route('/delete_file/<int:file_id>', methods=['DELETE'])
@login_required
def delete_file(file_id):
    try:
        file = File.query.get_or_404(file_id)
        
        if file.user_id != current_user.id:
            abort(403, description="You don't have permission to delete this file")
        
        if file.is_folder:
            def delete_folder_contents(folder_id):
                contents = File.query.filter_by(parent_folder_id=folder_id).all()
                for item in contents:
                    if item.is_folder:
                        delete_folder_contents(item.id)
                    else:
                        try:
                            if os.path.exists(item.filepath):
                                os.remove(item.filepath)
                        except OSError as e:
                            app.logger.error(f"Error deleting file {item.filepath}: {str(e)}")
                    db.session.delete(item)
                
            delete_folder_contents(file.id)
        else:
            try:
                if os.path.exists(file.filepath):
                    os.remove(file.filepath)
            except OSError as e:
                app.logger.error(f"Error deleting file {file.filepath}: {str(e)}")
        
        db.session.delete(file)
        db.session.commit()
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in delete_file: {str(e)}")
        return jsonify({'error': 'Failed to delete file'}), 500

@app.route('/folder/<int:folder_id>')
@login_required
def open_folder(folder_id):
    try:
        folder = File.query.get_or_404(folder_id)
        
        if folder.user_id != current_user.id:
            abort(403, description="You don't have permission to access this folder")
            
        if not folder.is_folder:
            abort(400, description="Specified ID is not a folder")
        
        contents = File.query.filter_by(parent_folder_id=folder_id).order_by(
            File.is_folder.desc(),
            File.filename
        ).all()
        
        folder_path = []
        current = folder
        while current:
            folder_path.insert(0, current)
            if current.parent_folder_id:
                current = File.query.get(current.parent_folder_id)
            else:
                break
        
        return render_template('dashboard.html', 
                             files=contents, 
                             current_folder=folder,
                             folder_path=folder_path)
                             
    except Exception as e:
        app.logger.error(f"Error in open_folder: {str(e)}")
        abort(500, description="Error occurred while opening folder")

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        flash('No file part')
        return redirect(url_for('dashboard'))
    
    file = request.files['file']
    folder_id = request.form.get('folder_id')
    
    if file.filename == '':
        flash('No selected file')
        return redirect(url_for('dashboard'))
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id), filename)
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        file.save(filepath)
        
        new_file = File(filename=filename, filepath=filepath, 
                        user_id=current_user.id, 
                        parent_folder_id=folder_id)
        
        db.session.add(new_file)
        db.session.commit()
        
        flash('File uploaded successfully')
        return redirect(url_for('dashboard'))

@app.route('/create_folder', methods=['POST'])
@login_required
def create_folder():
    folder_name = request.form['folder_name']
    parent_folder_id = request.form.get('parent_folder_id')
    
    new_folder = File(filename=folder_name, 
                      filepath='', 
                      user_id=current_user.id, 
                      is_folder=True, 
                      parent_folder_id=parent_folder_id)
    
    db.session.add(new_folder)
    db.session.commit()
    
    flash('Folder created successfully')
    return redirect(url_for('dashboard'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': str(error.description)}), 404

@app.errorhandler(403)
def forbidden_error(error):
    return jsonify({'error': str(error.description)}), 403

@app.errorhandler(400)
def bad_request_error(error):
    return jsonify({'error': str(error.description)}), 400

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': str(error.description)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)